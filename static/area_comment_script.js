var data;

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

function makeCommentList() {
    const commentGroup = document.getElementById('comment-group');
    while (commentGroup.firstChild)
        commentGroup.removeChild(commentGroup.firstChild);

    for (let i = 0; i < data.length; i++) {
        const comment = data[i];
        const newGroupItem = document.createElement('li');
        newGroupItem.classList.add('list-group-item');
        newGroupItem.innerHTML = `
            <input style="display: none;" type="commentid" value="${comment[0]}">
            <div class="row">
                <div class="col-10 p-2">
                    <p class="text-secondary h6 font-weight-bold">${comment[4]}</p>
                    <p>${comment[2]}</p>
                </div>
                <div class="col-2 p-1">
                    <div class="btn-group-vertical">
                        <button type="btn" class="btn text-secondary" id="add-${comment[0]}"><i class="fas fa-thumbs-up" style="margin-right: 0px;"></i></button>
                        <span class="btn font-weight-bold">${comment[3]}</span>
                        <button type="btn" class="btn text-secondary" id="sub-${comment[0]}"><i class="fas fa-thumbs-down" style="margin-right: 0px;"></i></button>
                    </div>
                </div>
            </div>
        `

        commentGroup.appendChild(newGroupItem);
        document.getElementById('add-' + comment[0]).addEventListener('click', () => {
            const commentId = newGroupItem.querySelector('input[type="commentid"]').value;
            if (document.getElementById('add-' + commentId).classList.contains('active')) {
                document.getElementById('add-' + commentId).classList.remove('active');

                document.getElementById('add-' + commentId).classList.remove('text-primary');
                document.getElementById('add-' + commentId).classList.add('text-secondary');

                newGroupItem.querySelector('span').innerHTML = parseInt(newGroupItem.querySelector('span').innerHTML) - 1;

                // 修改 data 数组中的相应值
                for (let i = 0; i < data.length; i++) {
                    if (data[i][0] == commentId) {
                        data[i][3] -= 1;
                        break;
                    }
                }

                fetch('/update_comment_score', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: commentId,
                        is_upvote: false
                    })
                });
            } else {
                document.getElementById('add-' + commentId).classList.add('active');

                document.getElementById('add-' + commentId).classList.remove('text-secondary');
                document.getElementById('add-' + commentId).classList.add('text-primary');

                newGroupItem.querySelector('span').innerHTML = parseInt(newGroupItem.querySelector('span').innerHTML) + 1;

                // 修改 data 数组中的相应值
                for (let i = 0; i < data.length; i++) {
                    if (data[i][0] == commentId) {
                        data[i][3] += 1;
                        break;
                    }
                }

                fetch('/update_comment_score', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: commentId,
                        is_upvote: true
                    })
                });
            }
        });

        document.getElementById('sub-' + comment[0]).addEventListener('click', () => {
            const commentId = newGroupItem.querySelector('input[type="commentid"]').value;
            if (document.getElementById('sub-' + commentId).classList.contains('active')) {
                document.getElementById('sub-' + commentId).classList.remove('active');

                document.getElementById('sub-' + commentId).classList.remove('text-primary');
                document.getElementById('sub-' + commentId).classList.add('text-secondary');

                newGroupItem.querySelector('span').innerHTML = parseInt(newGroupItem.querySelector('span').innerHTML) + 1;

                // 修改 data 数组中的相应值
                for (let i = 0; i < data.length; i++) {
                    if (data[i][0] == commentId) {
                        data[i][3] += 1;
                        break;
                    }
                }

                fetch('/update_comment_score', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: commentId,
                        is_upvote: true
                    })
                });
            } else {
                document.getElementById('sub-' + commentId).classList.add('active');

                document.getElementById('sub-' + commentId).classList.remove('text-secondary');
                document.getElementById('sub-' + commentId).classList.add('text-primary');

                newGroupItem.querySelector('span').innerHTML = parseInt(newGroupItem.querySelector('span').innerHTML) - 1;

                // 修改 data 数组中的相应值
                for (let i = 0; i < data.length; i++) {
                    if (data[i][0] == commentId) {
                        data[i][3] -= 1;
                        break;
                    }
                }

                fetch('/update_comment_score', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: commentId,
                        is_upvote: false
                    })
                });
            }
        });
    }

    if (data.length === 0) {
        commentGroup.innerHTML = `<span class="p-2">还没有评论，来抢沙发吧~</span>`;
    }
};

window.addEventListener('load', async () => {
    const areaId = document.getElementById('area-id').value;
    const response = await fetch(`/get_comment_list?area_id=${areaId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    data = (await response.json()).data;

    // 默认按分数排序
    data = data.sort((a, b) => {
        if (a[3] != b[3])
            return b[3] - a[3];
        else {
            let date1 = new Date(a[4]);
            let date2 = new Date(b[4]);
            return date2.getTime() - date1.getTime();
        }
    });

    makeCommentList();

    document.getElementById('sort-by-time').addEventListener('click', () => {
        if (document.getElementById('sort-by-time').classList.contains('active'))
            return;
        document.getElementById('sort-by-time').classList.add('active');
        document.getElementById('sort-by-score').classList.remove('active');

        // 按照日期排序
        data = data.sort((a, b) => {
            let date1 = new Date(a[4]);
            let date2 = new Date(b[4]);
            return date2.getTime() - date1.getTime();
        });

        makeCommentList();
    });

    document.getElementById('sort-by-score').addEventListener('click', () => {
        if (document.getElementById('sort-by-score').classList.contains('active'))
            return;
        document.getElementById('sort-by-score').classList.add('active');
        document.getElementById('sort-by-time').classList.remove('active');

        // 按照分数排序
        data = data.sort((a, b) => {
            if (a[3] != b[3])
                return b[3] - a[3];
            else {
                let date1 = new Date(a[4]);
                let date2 = new Date(b[4]);
                return date2.getTime() - date1.getTime();
            }
        });

        makeCommentList();
    })

    document.getElementById('send-comment').addEventListener('click', () => {
        const content = document.getElementById('comment-input').value;
        if (content === '') {
            showErrorDialog('评论不能为空！');
            return;
        }
        fetch('/add_comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                area_id: areaId,
                content: content
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showSuccessDialog(data.message);
                } else {
                    showErrorDialog(data.message);
                }
            })
    });
})
