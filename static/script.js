var lat, lng;

function showErrorDialog(message) {
    Swal.fire({
        timer: 5000,
        position: window.innerWidth <= 768 ? "center" : "top", // 出现位置
        title: message,
        showConfirmButton: false, // 不显示确认按钮
        background: "#FFFFE0",
        toast: true, // toast为false的话是弹窗形式弹出，有遮罩层。默认为false
        width: "300px",
        padding: "10px",
        type: "error"
    });
}

function showSuccessDialog(message) {
    Swal.fire({
        timer: 5000,
        position: window.innerWidth <= 768 ? "center" : "top", // 出现位置
        title: message,
        showConfirmButton: false, // 不显示确认按钮
        background: "#FFFFE0",
        toast: true, // toast为false的话是弹窗形式弹出，有遮罩层。默认为false
        width: "300px",
        padding: "10px",
        type: "success"
    });
}

window.addEventListener('load', function () {
    // 若当前时间在 00:00 - 06:00 之间，则显示提示
    var now = new Date();
    var hour = now.getHours();
    if (hour >= 0 && hour < 6) {
        this.document.getElementById('overlay').style.display = 'none';
        Swal.fire({
            title: '温馨提示',
            text: '尼普顿充电桩在 00:00 ～ 06:00 不开放，请在其他时间段使用本系统！',
            type: 'info',
            confirmButtonText: '知道了'
        });
    }

    Swal.fire({
        title: '评论功能上线！',
        text: '在【情况总览】栏目中，可点击充电区域并发表你的评论了：区域是否只能给某些特定学院使用？哪些桩是坏的？……并动动手指，给评论点赞/踩吧！',
        type: 'info',
        confirmButtonText: '知道了'
    });

    try {
        if (this.navigator.geolocation) {
            this.navigator.geolocation.getCurrentPosition(position => {
                lat = position.coords.latitude;
                lng = position.coords.longitude;

                this.document.getElementById('overlay').style.display = 'none';

                this.fetch('/get_npd_token')
                    .then(response => response.json())
                    .then(async data => {
                        if (data.success) {
                            const headers = new Headers();
                            headers.append('REQ-NPD-TOKEN', data.data);

                            let response = await this.fetch(`https://gateway.hzxwwl.com/api/charging/pile/listCircleChargingArea?lng=${lng}&lat=${lat}&distanceLength=3&limit=12`, {
                                method: 'GET',
                                headers: headers
                            });
                            let chargingAreas = (await response.json()).data;
                            let areaScore = [];

                            const asyncForEach = async (area) => {
                                const response = await this.fetch(`https://gateway.hzxwwl.com/api/charging/pile/listChargingPileDistByArea?chargingAreaId=${area.id}`, {
                                    headers: headers
                                })
                                const chargingPiles = (await response.json()).data;

                                let inChargingList = [];
                                const distScore = 0.4 / (1 + parseFloat(area.distance));
                                const freeScore = 0.4 * (1 - 2 ** (-1 * area.totalFreeNumber));

                                for (const pile of chargingPiles.chargingPileList) {
                                    if (pile.statusDesc === "充电中") {
                                        inChargingList.push(pile.restMinute);
                                    }
                                }

                                inChargingList.sort();

                                let waitScore;

                                if (inChargingList.length === 0) {
                                    waitScore = 0.2;
                                } else if (inChargingList.length === 1) {
                                    waitScore = 0.2 / (1 + 0.2 * 0.9 * inChargingList[0]);
                                } else {
                                    waitScore = 0.2 / (1 + 0.2 * (0.9 * inChargingList[0] + 0.1 * inChargingList[1]));
                                }

                                areaScore.push({
                                    areaId: area.id,
                                    areaName: area.areaName,
                                    distance: area.distance,
                                    freePile: area.totalFreeNumber,
                                    leastWaitMinute: inChargingList.length > 0 ? inChargingList[0] : 0,
                                    score: distScore + freeScore + waitScore
                                })
                            }

                            const promises = chargingAreas.map(asyncForEach);
                            Promise.all(promises)
                                .then(() => {
                                    areaScore.sort((a, b) => b.score - a.score);

                                    var recommendListElement = this.document.getElementById('charging-recommendation-container');
                                    while (recommendListElement.firstChild)
                                        recommendListElement.removeChild(recommendListElement.firstChild);

                                    for (let i = 0; i < areaScore.length && i < 3; i++) {
                                        var cardElement = this.document.createElement('div');
                                        cardElement.className = 'card';
                                        cardElement.classList.add('mt-3');

                                        cardElement.addEventListener('click', () => {
                                            this.window.location.href = `https://wx.hzxwwl.com/prod/charging/#/detail/${areaScore[i].areaId}`;
                                        });

                                        var cardBodyElement = this.document.createElement('div');
                                        cardBodyElement.className = 'card-body';

                                        var cardTitleElement = this.document.createElement('h5');
                                        cardTitleElement.className = 'card-title';
                                        cardTitleElement.innerText = areaScore[i].areaName;

                                        var badgeElement = this.document.createElement('span');
                                        badgeElement.className = 'badge badge-pill badge-success ml-2';
                                        badgeElement.innerText = '推荐';

                                        var cardListElement = this.document.createElement('ul');
                                        var distanceLiElement = this.document.createElement('li');
                                        distanceLiElement.innerText = '距您 ' + areaScore[i].distance + ' km';
                                        var freeLiElement = this.document.createElement('li');
                                        freeLiElement.innerText = '有 ' + areaScore[i].freePile + ' 个空闲充电桩';
                                        var waitLiElement = this.document.createElement('li');
                                        waitLiElement.innerText = '充电中桩位最少需等待 ' + areaScore[i].leastWaitMinute + ' 分钟';

                                        cardListElement.appendChild(distanceLiElement);
                                        cardListElement.appendChild(freeLiElement);
                                        cardListElement.appendChild(waitLiElement);

                                        cardBodyElement.appendChild(cardTitleElement);
                                        cardBodyElement.appendChild(cardListElement);

                                        if (i === 0) {
                                            cardTitleElement.appendChild(badgeElement);
                                        }

                                        cardElement.appendChild(cardBodyElement);

                                        recommendListElement.appendChild(cardElement);
                                    }

                                    if (areaScore.length === 0) {
                                        var liElement = this.document.createElement('li');
                                        liElement.classList.add('p');
                                        liElement.classList.add('row');
                                        liElement.classList.add('m-1');
                                        liElement.innerHTML = '位置信息获取失败或附近没有充电区域';

                                        recommendListElement.appendChild(liElement);
                                    }
                                });

                            this.fetch(`https://gateway.hzxwwl.com/api/charging/pile/listCircleChargingArea?lng=${lng}&lat=${lat}&distanceLength=3&limit=25`, {
                                method: 'GET',
                                headers: headers
                            })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        var allListElement = this.document.getElementById('all-charging-area-list');
                                        // 移除列表中的元素
                                        while (allListElement.firstChild)
                                            allListElement.removeChild(allListElement.firstChild);

                                        var ulElement = this.document.createElement('ul');
                                        ulElement.classList.add('list-group');
                                        ulElement.classList.add('m-2');

                                        var allList = data.data;
                                        for (let i = 0; i < allList.length; i++) {
                                            var liElement = this.document.createElement('li');
                                            liElement.classList.add('list-group-item');
                                            liElement.classList.add('row');

                                            liElement.addEventListener('click', () => {
                                                this.window.location.href = `/comment_page?area_name=${allList[i].areaName}&distance=${allList[i].distance}&free_number=${allList[i].totalFreeNumber}&total_number=${allList[i].totalPileNumber}&area_id=${allList[i].id}`;
                                            });

                                            var NameColElement = this.document.createElement('div');
                                            NameColElement.classList.add('font-weight-bold');
                                            NameColElement.innerText = allList[i].areaName;

                                            var infoDivElement = this.document.createElement('div');
                                            infoDivElement.classList.add('flex-grow-1');

                                            var DistanceColElement = this.document.createElement('span');
                                            DistanceColElement.innerText = allList[i].distance + ' km';

                                            var FreeColElement = this.document.createElement('span');
                                            FreeColElement.classList.add('text-primary');
                                            FreeColElement.classList.add('ml-4');
                                            FreeColElement.classList.add('font-weight-bold');
                                            if (allList[i].totalFreeNumber === 0) {
                                                FreeColElement.innerHTML = '<span class="text-danger">' + allList[i].totalFreeNumber + '</span>/' + allList[i].totalPileNumber;
                                                var newOption = this.document.createElement('option');
                                                newOption.value = allList[i].id;
                                                newOption.innerText = allList[i].areaName;
                                                this.document.getElementById('location').appendChild(newOption);
                                            }
                                            else if (allList[i].totalFreeNumber <= 3)
                                                FreeColElement.innerHTML = '<span class="text-warning">' + allList[i].totalFreeNumber + '</span>/' + allList[i].totalPileNumber;
                                            else
                                                FreeColElement.innerHTML = '<span class="text-success">' + allList[i].totalFreeNumber + '</span>/' + allList[i].totalPileNumber;

                                            liElement.appendChild(NameColElement);
                                            infoDivElement.appendChild(DistanceColElement);
                                            infoDivElement.appendChild(FreeColElement);
                                            liElement.appendChild(infoDivElement);

                                            ulElement.appendChild(liElement);
                                        }
                                        if (allList.length === 0) {
                                            var liElement = this.document.createElement('li');
                                            liElement.classList.add('list-group-item');
                                            liElement.classList.add('row');
                                            liElement.innerHTML = '位置信息获取失败或附近没有充电区域';
                                            ulElement.appendChild(liElement);
                                        }

                                        allListElement.appendChild(ulElement);
                                    } else {
                                        showErrorDialog(data.message);
                                    }
                                })
                                .catch(err => {
                                    showErrorDialog(err.message);
                                });
                        } else {
                            showErrorDialog(data.message);
                        }
                    })
                    .catch(err => showErrorDialog(err.message));
            });
        } else {
            showErrorDialog("您的浏览器不支持地理位置定位，请在微信中打开此页面！");
        }
    } catch {
        showErrorDialog("定位失败！");
    }

    this.document.getElementById('subscribe').addEventListener('click', (event) => {
        event.preventDefault();
        if (this.document.getElementById('location').selectedIndex === 0) {
            showErrorDialog('请选择充电区域');
            return;
        }

        const selectedValue = this.document.getElementById('location').value;
        const email = this.document.getElementById('email').value;
        //检测 email 中是否只包含数字和字母
        const reg = /^[A-Za-z0-9]+$/;
        if (!reg.test(email)) {
            showErrorDialog('请输入正确的邮箱地址');
            return;
        }

        this.fetch('/subscribe_area', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: selectedValue,
                email: email
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success)
                    showSuccessDialog(data.message);
                else
                    showErrorDialog(data.message);
            })
            .catch(err => showErrorDialog(err.message));
    });
});