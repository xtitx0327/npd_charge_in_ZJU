import requests

def get_npd_token(openid, unionid):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63090719) XWEB/8391',
        'Origin': 'https://wx.hzxwwl.com',
        'Referer': 'https://wx.hzxwwl.com'
    }
    response = requests.get(f'https://gateway.hzxwwl.com/api/auth/wx/mp?openid={openid}&unionid={unionid}', headers = headers, verify = False, timeout = 10)
    return response.json()['data']['token']


def get_circle_charging_area(npd_token, lng, lat, distance_length = 3, limit = 15):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63090719) XWEB/8391',
        'Origin': 'https://wx.hzxwwl.com',
        'Referer': 'https://wx.hzxwwl.com',
        'REQ-NPD-TOKEN': npd_token
    }
    response = requests.get(f'https://gateway.hzxwwl.com/api/charging/pile/listCircleChargingArea?lng={lng}&lat={lat}&distanceLength={distance_length}&limit={limit}', headers = headers, verify = False, timeout = 10)
    return response.json()['data']


def get_charging_pile_dist_by_area(npd_token, charging_area_id):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63090719) XWEB/8391',
        'Origin': 'https://wx.hzxwwl.com',
        'Referer': 'https://wx.hzxwwl.com',
        'REQ-NPD-TOKEN': npd_token
    }
    response = requests.get(f'https://gateway.hzxwwl.com/api/charging/pile/listChargingPileDistByArea?chargingAreaId={charging_area_id}', headers = headers, verify = False, timeout = 10)
    return response.json()['data']