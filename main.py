import json
import npd
import requests

from comment import comment_db
from flask import Flask, render_template, request, jsonify
from uuid import uuid1
from datetime import datetime
from flask_limiter import Limiter
from flask_apscheduler import APScheduler
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)

####################
#   配置定时任务
####################

scheduler = APScheduler(BackgroundScheduler)

class ScheduleConfig:
    JSONIFY_PRETTYPRINT_REGULAR = True
    SCHEDULER_API_ENABLED = True
    SCHEDULER_API_PREFIX = '/api/scheduler'

app.config.from_object(ScheduleConfig)

####################
#   配置跨域请求
####################

CORS(app)

####################
#   其他应用配置
####################

app.config['SECRET_KEY'] = str(uuid1())

app.jinja_environment.auto_reload = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

####################
#   初始化全局变量
####################

config : dict = {}
subscription : dict = {}

access_token : str = None
access_token_create_time : datetime = None

def update_access_token() -> str:
    global access_token
    global access_token_create_time
    if access_token is None or (datetime.now() - access_token_create_time).seconds > 7000:
        response = requests.get('https://api.weixin.qq.com/cgi-bin/token', params = {
            'grant_type': 'client_credential',
            'appid': config['appid'],
            'secret': config['appsecret']
        })
        data = response.json()
        access_token = data['access_token']
        access_token_create_time = datetime.now()
    return access_token

def get_remote_adress() -> str:
    if 'X-Real-Ip' in request.headers and request.headers['X-Real-Ip'] is not None:
        return request.headers['X-Real-Ip']
    else:
        return request.remote_addr

limiter = Limiter(app = app, key_func = get_remote_adress, default_limits = ['10 per minute', '60 per hour'])

def update_npd_token():
    if 'npd_token' not in config or (datetime.now() - config['token_create_time']).seconds > 86000:
        config['npd_token'] = npd.get_npd_token(config['openid'], config['unionid'])
        config['token_create_time'] = datetime.now()

####################
#   应用路由函数
####################

@app.route('/')
def index():
    return render_template('index.html')

@app.errorhandler(429)
def ratelimit_handler(err):
    return render_template('429.html'), 429

@limiter.limit('10 per minute')
@limiter.limit('60 per hour')
@app.route('/get_npd_token', methods = ['GET'])
def get_npd_token():
    try:
        update_npd_token()
        return jsonify({'success': True, 'data': config['npd_token']})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@scheduler.task('interval', id = 'job1', seconds = 60)
def update_subscription():
    global subscription

    try:
        update_npd_token()
        try:
            data = npd.get_circle_charging_area(
                config['npd_token'],
                config['site'][3]['lng'],
                config['site'][3]['lat'],
                limit=200,
                distance_length=150,
            )
        except Exception as e:
            return

        for area in data:
            if str(area['id']) in subscription:
                total_free = int(area['totalFreeNumber'])
                area_id = str(area['id'])
                if total_free > 0:
                    area_name = area['areaName']
                    for openid in subscription[area_id]['openid']:
                        access_token = update_access_token()
                        requests.post('https://api.weixin.qq.com/cgi-bin/message/subscribe/send', params = {
                            'access_token': access_token
                        }, json = {
                            'touser': openid,
                            'template_id': 'yAtlxMfub7xaCnnTE7Y3CdNlwpXA5J5eNjX2CjBwfBc',
                            'page': '/',
                            'data': {'time1': {'value': datetime.now().strftime('%Y年%m月%d日 %H:%M')}, 'thing2': {'value': area_name}}
                        }, timeout = 10, verify = False)
                    subscription[area_id]['openid'] = []
    except:
        pass

@limiter.limit('15 per day')
@app.route('/subscribe_area', methods=['POST'])
def subscribe_area():
    global subscription

    area_id = str(request.get_json().get('area_id'))
    openid = request.get_json().get('openid')

    if area_id is None or openid is None:
        return jsonify({'success': False, 'message': '请提供有效的信息'})

    count = 0
    for id in subscription:
        if openid in subscription[id]['openid']:
            count += 1
        if count >= 3:
            return jsonify({'success': False, 'message': '您的订阅数量已达上限'})

    if area_id in subscription:
        if openid in subscription[area_id]['openid']:
            return jsonify({'success': False, 'message': '您已经订阅过该区域了'})
        else:
            subscription[area_id]['openid'].append(openid)
            return jsonify({'success': True, 'message': '订阅成功，请注意查收消息'})
    else:
        subscription[area_id] = {'openid': [openid]}
        return jsonify({'success': True, 'message': '订阅成功，请注意查收消息！'})

@limiter.limit('20 per minute')
@app.route('/comment_page', methods=['GET'])
def comment_page():
    area_name = request.args.get('area_name')
    distance = request.args.get('distance')
    free_number = request.args.get('free_number')
    total_number = request.args.get('total_number')
    area_id = request.args.get('area_id')

    return render_template(
        'area_comment.html',
        area_name = area_name,
        distance = distance,
        free_number = int(free_number),
        total_number = total_number,
        area_id = area_id,
    )

@app.route('/get_comment_list', methods=['GET'])
def get_comment_list():
    try:
        area_id = request.args.get('area_id')
        return jsonify({'success': True, 'data': comment_db.get_comments(area_id)})
    except:
        return jsonify({'success': False, 'message': '获取评论列表失败'})

@app.route('/update_comment_score', methods=['POST'])
def update_comment_score():
    try:
        id = request.get_json().get('id')
        is_upvote = request.get_json().get('is_upvote')
        comment_db.update_score(id, is_upvote)
        return jsonify({'success': True})
    except:
        return jsonify({'success': False, 'message': '更新评论分数失败'})

@limiter.limit('1 per minute')
@limiter.limit('10 per day')
@app.route('/add_comment', methods=['POST'])
def add_comment():
    try:
        area_id = request.get_json().get('area_id')
        content = request.get_json().get('content')
        if len(content) > 500:
            return jsonify({'success': False, 'message': '评论过长，请重试'})
        comment_db.add_comment(area_id, content)
        return jsonify({'success': True, 'message': '评论成功，可在刷新后查看'})
    except:
        return jsonify({'success': False, 'message': '添加评论失败'})

@app.route('/get_openid', methods = ['GET'])
def get_openid():
    code = request.args.get('code')
    print(code)
    response = requests.get('https://api.weixin.qq.com/sns/jscode2session', params = {
        'appid': config['appid'],
        'secret': config['appsecret'],
        'js_code': code,
        'grant_type': 'authorization_code'
    })
    data = response.json()
    print(data)
    if 'openid' in data:
        return jsonify({'success': True, 'openid': data['openid']})
    else:
        return jsonify({'success': False, 'message': '获取openid失败', 'errcode': data['errcode']})

if __name__ == '__main__':
    try:
        with open('config.json', encoding='utf-8') as f:
            config = json.load(f)
    except Exception as e:
        print(str(e))
        exit(1)

    scheduler.init_app(app)
    scheduler.start()
    app.run(debug = config['debug'], port = 8004)