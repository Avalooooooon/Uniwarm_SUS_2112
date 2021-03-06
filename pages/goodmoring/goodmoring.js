// pages/goodmoring/goodmoring.js
const app = getApp()
let loadingMore = false
let lastScollTop = 0;
let lastRequestTime = 0;
let postId = 0; //当前是第几张图，从0开始。
let TAG = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let NUM = 0

Page({

    /**
     * 页面的初始数据
     */
    data: {
        showdata: [],
        vertical: true, //是否纵向滑动
        // indicatordots: true, //是否显示指示点
        indicatordots: false,
        duration: 500, //滑动动画时长

        hasMore: true, //列表是否有数据未加载
        scrollYHeight: 0, //scroll-view高度
        page: 0,
        size: 4, //每页4条

        tag: [],
        daodi: false,
        lastpagesize: 0,   //加上最后一页（非空白页）的图的总图数
        scrolltobottom: false,
        num: 0,
        postid: ''
    },
    saveimage:function(e) {
        let _this = this
        wx.showActionSheet({
            itemList: ['保存到相册'],
            success(res) {
                let url = e.target.dataset.currenturl;;
                wx.getSetting({
                    success: (res) => {
                        if (!res.authSetting['scope.writePhotosAlbum']) {
                            wx.authorize({
                                scope: 'scope.writePhotosAlbum',
                                success: () => {
                                    // 同意授权
                                    _this.saveImgInner(url);
                                },
                                fail: (res) => {
                                    console.log(res);
                                    wx.showModal({
                                        title: '保存失败',
                                        content: '请开启访问手机相册权限',
                                        success(res) {
                                            wx.openSetting()
                                        }
                                    })
                                }
                            })
                        } else {
                            // 已经授权了
                            _this.saveImgInner(url);
                        }
                    },
                    fail: (res) => {
                        console.log(res);
                    }
                })
            },
            fail(res) {
                console.log(res.errMsg)
            }
        })
    },

    // 长按保存功能--保存部分
    saveImgInner:function(url) {
        wx.getImageInfo({
            src: url,
            success: (res) => {
                let path = res.path;
                wx.saveImageToPhotosAlbum({
                    filePath: path,
                    success: (res) => {
                        console.log(res);
                        wx.showToast({
                            icon: 'success',
                            title: '已保存到相册',
                        })
                    },
                    fail: (res) => {
                        console.log(res);
                    }
                })
            },
            fail: (res) => {
                console.log(res);
            }
        })
    },

    onSlideChange: function (e) { //swiper。postId为当前swiper-item编号。
        postId = e.detail.current;
        this.setData({
            postid: postId
        });
        console.log(postId);
    },
    bindscroll: function (e) {
        const {
            scrollHeight,
            scrollTop
        } = e.detail;
        const {
            scrollYHeight,
            hasMore
        } = this.data;
        //如果当前没有加载中且列表还有数据未加载，且页面滚动到距离底部40px内。这里(postId + 1) % x，x=data里的size
        if (!loadingMore && hasMore && (postId + 1) % 4 == 0 && (scrollHeight - scrollYHeight - scrollTop < 40) && lastScollTop <= scrollTop) {
            this.loadMore()
            if ((postId + 1) == this.data.lastpagesize && lastScollTop <= scrollTop || (lastScollTop > scrollTop && (scrollHeight - scrollYHeight - scrollTop < 40))) {
                this.setData({
                    scrolltobottom: true,
                })
            }
            console.log(this.data.scrolltobottom)
            console.log("要加载loadMore")
        }
        if ((postId + 1) != this.data.lastpagesize || (lastScollTop > scrollTop && (scrollHeight - scrollYHeight - scrollTop > 5))) {
            this.setData({
                scrolltobottom: false,
            })
        }
        if ((postId + 1) == this.data.lastpagesize && lastScollTop <= scrollTop || (lastScollTop > scrollTop && (scrollHeight - scrollYHeight - scrollTop < 40))) {
            this.setData({
                scrolltobottom: true,
            })
        }
        lastScollTop = scrollTop
    },
    loadMore: function () { //判断需要加载更多后，执行该函数。该函数调用下面的fetchList（）。
        const {
            page,
            hasMore
        } = this.data; //用data里的这俩给这俩赋值。hasMore初始为真，只要还有没加载的就一直为真；
        //page是干啥的？
        console.log(page);
        console.log(hasMore);
        if (!hasMore || loadingMore) return; //如果hasMore为假或者loadingMore为真，直接返回，不进行操作。
        loadingMore = true // loadingMore在Page外，初始值为假。
        setTimeout(
            () => {
                //本来得加一，这里先用的不加一的。就是this.fetchList(page+1，（）
                this.fetchList(page + 1, () => { //用data里的page值+1后传给fetchList（）
                    loadingMore = false;
                })
            }, 333
        )

    },
    fetchList: function (page, cb) {
        let nowRequestTime = (new Date()).getTime();
        //限制两次网络请求间隔至少1秒
        if (nowRequestTime - lastRequestTime < 1000) {
            if (cb) cb();
            return;
        }
        lastRequestTime = nowRequestTime;

        wx.request({
            url: 'https://www.bizspace.cn/api/wechatweb/v1/images/hello',
            data: {
                token: wx.getStorageSync('token'),
                bizid: 'uniwarm', //string。企业id, 固定为uniwarm
                page: page, //int。页数，从0开始，每页10条
                device: '',
                wechat: ''
            },
            method: "get", //http请求方法，主要有POST和GET
            header: {},

            success: (res) => {
                console.log('submit success');
                console.log(res.data.data)
                if (res.data.res != 0) {
                    console.log("服务器返回请求不成功，出现某种问题，需要处理")
                } else if (res.data.res == 0) {
                    console.log("服务器返回请求成功")
                    let showdata = res.data.data || [];
                    if (showdata.length == 0) {
                        this.setData({
                            hasMore: false,
                            page,
                            daodi: true
                        })
                    } else {
                        this.setData({
                            showdata: this.data.showdata.concat(showdata),
                            hasMore: showdata.length == this.data.size,
                            page,

                            lastpagesize: this.data.lastpagesize + res.data.data.length
                        })
                    }
                }
                if (cb) { // 这个不知道干啥的
                    cb()
                }
            },
            fail: (res) => {
                console.log('submit fail'); //API请求失败
                wx.showToast({
                    title: "列表加载失败",
                    icon: 'none',
                    duration: 1000
                })
                if (cb) { // 这个不知道干啥的
                    cb()
                }
            },
            complete: (res) => {
                console.log('submit complete');
                this.setData({
                    num: NUM,
                })
                TAG[NUM] = 1;
                if (NUM != 0) {
                    TAG[NUM - 1] = 0;
                }
                this.setData({
                    tag: TAG,
                })
                NUM += 1;
                console.log(this.data.num);
                console.log(this.data.tag);
            }
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.fetchList(0) //加载第一页数据
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        wx.getSystemInfo({
            success: ({
                windowHeight
            }) => {
                this.setData({
                    scrollYHeight: windowHeight
                }) //设置scrill-view组件的高度为屏幕高度
            }
        })
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})