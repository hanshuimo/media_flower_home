import {
    camera,
    controls,
    scene,
    renderer,
    container,
    dControl,
    model,
    video,
    image,
    selectedObjectsPaper,
    operate
} from "./index"
import * as THREE from 'three/build/three.module.js'
import {Water} from 'three/examples/jsm/objects/Water.js'
import {
    createModel,
    getRayObject,
    showMessage,
    changeClientToWorldVector,
    changeObjectToCenter, showOperate
} from "./util"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js"

//水槽，桌子，筛子，棍子，木桶1，木桶2，刷子，group存放刷子让刷子中心在模型中心
let gltfWaterChannel, gltfTable, gltfSifter, gltfClub, gltfBigBucket11, gltfBigBucket12, gltfBrush, groupBrush,
    boxGltfClub
//水槽里的水,筛子做出的纸张，桌子上的一沓纸,挂在墙上的纸,挂墙上的纸的褶皱1234
let objWater, objPaper, objPaper1, objPaper2, objWrinkle1, objWrinkle2, objWrinkle3, objWrinkle4
//判断筛子在墙上还是在水槽上 false=>墙上 true=>水槽上; 筛子动画 ifCameraP1=>判断是否保存进入动画时照相机位置; 判断筛子是否运动;动作是否完成
let ifGlitfSifter = false, ifCameraP1 = false, ifup1 = false, ifFinish1 = false
//判断棒子在墙上还是在水槽上 false=>墙上 true=>水槽上; 棒子动画 ifCameraP1=>判断是否保存进入动画时照相机位置; 判断棒子是否运动; 判断棒子是否来回运动；动作是否完成
let ifGltfClub = false, ifCameraP2 = false, ifup2 = false, timerGltfClub = null, time2 = 0, ifFinish2 = false
//判断纸堆动画是否开启;判断挂墙上的纸张以及褶皱是否出现;判断长按是否刷到褶皱；动作是否完成
let ifGltfBrush = false, ifPaper = false, ifCameraP3 = false, ifup3 = false, ifFinish3 = false
//单击双击设置clickTime防止冲突
let clickTime = null
//保存重力加速度g三个方向的值
let gX = 0, gY = 0, gZ = 0
//刷子动画，判断鼠标/刷子运动方向
let yArray = [], xArray = []

//捞纸动作
let setLao = {
    //创建筛子模型
    createShaiZi: () => {
        createModel({
            gltf: true,
            url: model.laoZhi,
            name: 'gltfSifter',
            function: (gltf) => {
                gltf.scale.set(5, 5, 5)
                gltfSifter = changeObjectToCenter(gltf, true)
                scene.add(gltfSifter)
                gltfSifter.position.set(28, 5, 135)
                gltfSifter.rotation.z = -Math.PI / 3
                // 水平面y 5.1
            }
        })
    },
    //双击确定
    doubleClickLao: (modelName) => {
        if (modelName === 'gltfSifter') {
            showMessage('取出压榨浸泡的原料倾倒入纸槽里面。用细竹帘在纸浆中滤取，纸纤维留在竹帘上形成一层纸膜。根据季节、竹子质量差异用纯天然植物原料配比不同的催化剂来控制纸纤维悬浮液的浓度', image.makePaper2, () => {
            }, () => {
            }, () => {
                ifGlitfSifter = true
                gltfSifter.position.set(28, 5.2, 124)
                gltfSifter.rotation.z = 0
                gltfSifter.rotation.y = Math.PI / 2
                //判断operate是否存在
                if (operate.isEmpty()) {
                    //init初始化operate
                    //pushElement创建div
                    operate.init().pushElement(() => {
                        let div = document.createElement("div")
                        div.innerText = "1.请移动至水槽"
                        return div
                    }).pushCancel(() => {
                        //删除operate
                        operate.delete()
                        //捞纸动画开始
                        if (ifCameraP1) {
                            if (ifGlitfSifter) {
                                ifGlitfSifter = false
                                gltfSifter.position.set(28, 5, 135)
                                gltfSifter.rotation.z = -Math.PI / 3
                                gltfSifter.rotation.y = 0
                            }
                            objPaper.material.opacity = 0
                            objPaper.position.set(28, 5.2, 124)
                            ifCameraP1 = false
                            camera.position.set(32, 12, 123)
                        }
                        //捞纸动画还未触发
                        else {
                            ifGlitfSifter = false
                            gltfSifter.position.set(28, 5, 135)
                            gltfSifter.rotation.z = -Math.PI / 3
                            gltfSifter.rotation.y = 0
                            objPaper.material.opacity = 0
                            objPaper.position.set(4.3, 3.3, -9.3)
                        }
                    })
                    //双击事件
                    operate.pushConfirm(() => {
                        //判断动作是否完成
                        if (ifFinish1 === true) {
                            ifFinish1 = false
                            ifGlitfSifter = false
                            gltfSifter.position.set(28, 5, 135)
                            gltfSifter.rotation.z = -Math.PI / 3
                            gltfSifter.rotation.y = 0
                            objPaper.material.opacity = 0
                            objPaper.position.set(4.3, 3.3, -9.3)
                            ifCameraP1 = false
                            camera.position.set(32, 12, 123)
                            //让纸堆模型发光
                            selectedObjectsPaper[0] = objPaper1
                            //删除operate
                            operate.delete()
                        }
                    })
                }
            })
        }
    },
    //单击取消
    oneClickLao: () => {
    },
    //长按开始
    ontouchstartLao: () => {
        ifup1 = true
    },
    //长按结束
    ontouchendLao: () => {
        ifup1 = false
    },
    //筛子动画
    animateLao: (cameraP) => {
        //判断筛子是否存在
        if (gltfSifter) {
            //计算筛子和相机之间的距离
            let swifterP = gltfSifter.position
            let distance = cameraP.distanceTo(swifterP)
            //筛子触发条件：距离小于等于8，双击是否选中筛子，相机是否锁定
            if (distance <= 19 && ifGlitfSifter && !ifCameraP1) {
                ifCameraP1 = true
                //触发剧情
                operate.pushElement(() => {
                    let div = document.createElement('div')
                    div.innerText = '2.请长按并上下移动手机进行筛纸'
                    return div
                })
                operate.pushElement(() => {
                    let div = document.createElement('div')
                    let img = document.createElement('img')
                    img.src = image.gifLao
                    img.width = 100
                    img.height = 100
                    div.appendChild(img)
                    return div
                })
            }
        }
        if (ifCameraP1) {
            //将相机位置锁定开始动画
            camera.position.set(32, 12, 123)
            //判断是否有手指触发
            if (ifup1) {
                //假如重力加速度大于9.7且筛子y轴大于3.5触发，筛子向下移动
                if (gZ > 9.7 && gltfSifter.position.y > 4.6) {
                    gltfSifter.position.y -= 0.05
                    objPaper.position.y -= 0.05
                }
                //反之，筛子向上移动
                if (gZ < 9.5 && gltfSifter.position.y < 5.6) {
                    gltfSifter.position.y += 0.05
                    objPaper.position.y += 0.05
                }
                //假如筛子在水面下，纸张透明度增加
                if (objPaper.position.y <= 5.1) {
                    objPaper.material.opacity += 0.01
                }
                //当纸张透明度接近1时动作完成，单击取消即可重复体验，双击则体验下一步
                if (objPaper.material.opacity >= 0.98) {
                    //透明度ok时触发完成动画
                    if (!ifFinish1) {
                        ifFinish1 = true
                        operate.pushElement(() => {
                            let div = document.createElement('div')
                            div.innerText = '3.筛纸完成，请双击继续'
                            return div
                        })
                    }
                }
            }
        }

    }
}
//搅拌动作
let setJiao = {
    createClub: () => {
        createModel({
            gltf: true,
            url: model.club,
            name: 'gltfClub',
            function: (gltf) => {
                gltfClub = changeObjectToCenter(gltf, true)
                gltfClub.position.set(27, 4, 140)
                gltfClub.scale.set(5, 5, 5)
                //左边界-7  右边界-13
                gltfClub.rotation.y = 4
                scene.add(gltfClub)
                selectedObjectsPaper[0] = gltfClub
                dispersed(2, 'gltfClub', new THREE.Box3().setFromObject(gltfClub), gltfClub.position)
            }
        })
    },
    doubleClickClub: (modelName) => {
        if (modelName === 'box_gltfClub') {
            showMessage('在泽雅地区采用“踏料”的方法把经过去除杂物后的竹浆放入大石臼中，用脚或者水碓不停地捣制，使纤维彻底分离并浸透水分，使竹浆成糊状', image.makePaper1, () => {
            }, () => {
            }, () => {
                ifGltfClub = true
                gltfClub.position.set(28, 5, 123)
                if (operate.isEmpty()) {
                    operate.init().pushElement(() => {
                        let div = document.createElement("div")
                        div.innerText = "1.请移动至水槽"
                        return div
                    }).pushCancel(() => {
                        //还没走到水槽面前打印
                        operate.delete()
                        if (ifCameraP2) {
                            if (ifGltfClub) {
                                ifGltfClub = false
                                gltfClub.position.set(27, 4, 140)
                                gltfClub.rotation.y = 4
                            }
                            time2 = 0
                            ifCameraP2 = false
                            camera.position.set(32, 12, 123)
                        } else {
                            ifGltfClub = false
                            gltfClub.position.set(27, 4, 140)
                            gltfClub.rotation.y = 4
                        }
                    })
                    operate.pushConfirm(() => {
                        if (ifFinish2 === true) {
                            time2 = 0
                            ifFinish2 = false
                            ifGltfClub = false
                            gltfClub.position.set(27, 4, 140)
                            gltfClub.rotation.y = 4
                            ifCameraP2 = false
                            camera.position.set(32, 12, 123)
                            selectedObjectsPaper[0] = gltfSifter
                            operate.delete()
                        }
                    })
                }
            })
        }
    },
    oneClickClub: () => {
    },
    ontouchstartClub: () => {
        ifup2 = true
    },
    ontouchendClub: () => {
        ifup2 = false
    },
    animateClub: (cameraP) => {
        //搅拌动作
        if (gltfClub) {
            let clubP = gltfClub.position
            let distance1 = cameraP.distanceTo(clubP)
            if (distance1 <= 19 && ifGltfClub && !ifCameraP2) {
                ifCameraP2 = true
                operate.pushElement(() => {
                    let div = document.createElement('div')
                    div.innerText = '2.请长按并摇晃手机进行搅拌'
                    return div
                })
                operate.pushElement(() => {
                    let div = document.createElement('div')
                    let img = document.createElement('img')
                    img.src = image.gifJiao
                    img.width = 100
                    img.height = 100
                    div.appendChild(img)
                    return div
                })
            }
        }
        if (ifCameraP2) {
            camera.position.set(32, 12, 123)
            //长按
            if (ifup2) {
                //设置定时器，连续长按2s完成动作
                time2 += 1
                if (gY < 0 && gltfClub.position.z >= 120) {
                    gltfClub.rotation.y += 0.03
                    gltfClub.position.z -= 0.05
                }
                if (gY > 0 && gltfClub.position.z <= 126) {
                    gltfClub.rotation.y -= 0.03
                    gltfClub.position.z += 0.05
                }
                //animate是1s运行60次，即当time2等于120的时候运行了2s
                //当用户长按2s时触发完成动画
                //点击取消则计时器清空，重新体验
                //点击确定即体验下一步
                if (time2 >= 120) {
                    if (!ifFinish2) {
                        ifFinish2 = true
                        operate.pushElement(() => {
                            let div = document.createElement('div')
                            div.innerText = '3.搅拌完成，请双击继续'
                            return div
                        })
                    }
                }
            }
        }
    }
}
//纸堆定义
let setGroundPaper = {
    createGroundPaper: () => {
        makePaper(20, 5)

        //一沓纸函数
        function makePaper(num, y) {
            for (let i = 0; i < num; i++) {
                objPaper1 = createModel({
                    gltf: false,
                    geometry: new THREE.BoxBufferGeometry(2.8, 7.9, 0),
                    material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
                    textureLoaderUrl: image.paper,
                    name: 'objPaper1',
                    function: (mesh) => {
                        mesh.position.set(70, y, 114)
                        mesh.rotateX(Math.PI / 2)
                        mesh.rotateZ(Math.PI / 2)
                        scene.add(mesh)
                    }
                })
                y += 0.04
            }
        }
    }
}
let countShua = 0
//刷纸动作
let setShua = {
    //创建刷子模型
    createBrush: () => {
        createModel({
            gltf: true,
            url: model.brush,
            name: 'gltfBrush',
            function: (gltf) => {
                groupBrush = changeObjectToCenter(gltf, true)
                groupBrush.name = 'groupBrush'
                groupBrush.position.set(75, 5, 114)
                groupBrush.rotateX(Math.PI / 2)
                groupBrush.rotateZ(-Math.PI / 2)
                groupBrush.scale.set(20, 20, 20)
                groupBrush.name = 'groupBrush'
                scene.add(groupBrush)
            }
        })
    },
    //双击事件
    doubleClickBrush: (modelInfo) => {
        if (modelInfo.parent.name === 'gltfBrush' || modelInfo.name === 'objPaper1') {
            showMessage('焙干纸张的夹巷是两道土砖砌成的砖墙，砖块之间有空隙能让热气透出。焙纸时先在夹巷内生火，然后将将一张张湿纸摊在墙上，从空隙中散发的热气使纸张慢慢干燥，干透后揭起来就是一张可使用的纸了。', image.makePaper4, () => {
            }, () => {
            }, () => {
                //双击判断纸张是否出现，true出现，false隐藏
                ifPaper = true
                ifGltfBrush = true
                groupBrush.rotateZ(-Math.PI / 2)
                //挂在墙壁上的纸
                objPaper2 = createModel({
                    gltf: false,
                    geometry: new THREE.BoxBufferGeometry(30, 30, 0),
                    material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
                    textureLoaderUrl: image.paper,
                    name: 'objPaper2',
                    function: (mesh) => {
                        mesh.position.set(70, 18, 183)
                        scene.add(mesh)
                    }
                })
                selectedObjectsPaper.splice(1, 1)
                selectedObjectsPaper[0] = objPaper2
                objWrinkle1 = makeBall('objWrinkle1')
                objWrinkle2 = makeBall('objWrinkle2')
                objWrinkle3 = makeBall('objWrinkle3')
                objWrinkle4 = makeBall('objWrinkle4')

                if (operate.isEmpty()) {
                    operate.init().pushElement(() => {
                        let div = document.createElement("div")
                        div.innerText = "1.请移动至墙壁的纸前触发剧情"
                        return div
                    }).pushCancel(() => {
                        //还没走到水槽面前打印
                        operate.delete()
                        if (ifCameraP3) {
                            if (ifPaper) {
                                //纸张隐藏
                                ifPaper = false
                                //取消时将褶皱模型删除
                                scene.remove(objPaper2)
                                deleteMesh(objWrinkle1)
                                deleteMesh(objWrinkle2)
                                deleteMesh(objWrinkle3)
                                deleteMesh(objWrinkle4)
                            }
                            ifGltfBrush = false
                            //相机不固定
                            ifCameraP3 = false
                            //相机位置放到原来的位置
                            camera.position.set(70, 12, 156)
                            //筛子放回去
                            groupBrush.position.set(75, 5, 114)
                            groupBrush.rotation.x = 1.5
                            groupBrush.rotation.y = 0
                        } else {
                            ifGltfBrush = false
                            ifPaper = false
                            //取消时将褶皱模型删除
                            scene.remove(objPaper2)
                            deleteMesh(objWrinkle1)
                            deleteMesh(objWrinkle2)
                            deleteMesh(objWrinkle3)
                            deleteMesh(objWrinkle4)
                            groupBrush.position.set(75, 5, 114)
                            groupBrush.rotation.x = 1.5
                            groupBrush.rotation.y = 0
                        }
                    })
                    operate.pushConfirm(() => {
                        if (ifFinish3) {
                            ifGltfBrush = false
                            ifFinish3 = false
                            ifPaper = false
                            scene.remove(objPaper2)
                            deleteMesh(objWrinkle1)
                            deleteMesh(objWrinkle2)
                            deleteMesh(objWrinkle3)
                            deleteMesh(objWrinkle4)
                            ifCameraP3 = false
                            groupBrush.position.set(75, 5, 114)
                            groupBrush.rotation.x = 1.5
                            groupBrush.rotation.y = 0
                            operate.delete()
                        }
                    })
                }
            })
        }
    },
    //单击事件
    oneClickBrush: () => {
    },
    ontouchstartBrush: () => {
        ifup3 = true
        countShua = 0
    },
    //长按且移动事件，刷子动画
    ontouchmoveBrush: (event) => {
        if (countShua === 1) {
            countShua = 0
            return
        } else countShua = 1
        //关于判断手指移动方向
        //设置数组，将手指移动的client值push到数组中，通过比较后一位数组与前一位数组的大小判断手指移动方向
        //上下方向保存数组
        yArray.push(event.clientY)
        //左右方向保存数组
        xArray.push(event.clientX)
        //当数组长度大于10时，删除数组减少空间
        if (yArray.length > 10) yArray.splice(0, 7)
        if (xArray.length > 10) xArray.splice(0, 7)
        if (ifCameraP3) {
            //通过changeBrush函数将刷子与手指的位置绑定
            let brushP = changeBrush(event.clientX, event.clientY)
            if (groupBrush) {
                groupBrush.position.copy(brushP)
                //刷子动画
                //在y轴变化时改变刷子旋转方向
                if (groupBrush.rotation.x > 1.4 && yArray[yArray.length - 1] > yArray[yArray.length - 2]) {
                    groupBrush.rotation.x -= 0.1
                }
                if (groupBrush.rotation.x < 1.7 && yArray[yArray.length - 1] < yArray[yArray.length - 2]) {
                    groupBrush.rotation.x += 0.1
                }
                // //在x轴变化且当时手指在y轴方向向上移动时候
                if (groupBrush.rotation.y >= -0.63 && xArray[xArray.length - 1] < xArray[xArray.length - 2] && yArray[yArray.length - 1] < yArray[yArray.length - 2]) {
                    groupBrush.rotation.y -= 0.1
                }
                if (groupBrush.rotation.y <= 0.63 && xArray[xArray.length - 1] > xArray[xArray.length - 2] && yArray[yArray.length - 1] < yArray[yArray.length - 2]) {
                    groupBrush.rotation.y += 0.1
                }
                // //在x轴变化且当时手指在y轴方向向下移动时候
                // if (groupBrush.rotation.z <= 3 && xArray[xArray.length - 1] > xArray[xArray.length - 2] && yArray[yArray.length - 1] > yArray[yArray.length - 2]) {
                //     groupBrush.rotation.z += 0.1
                // }
                // if (groupBrush.rotation.z >= 1 && xArray[xArray.length - 1] < xArray[xArray.length - 2] && yArray[yArray.length - 1] > yArray[yArray.length - 2]) {
                //     groupBrush.rotation.z -= 0.1
                // }
                //获取手指发出射线位置，判断褶皱是否被刷到
                let info = getRayObject(event.clientX, event.clientY)
                //判断褶皱位置，假如被射线获取，则褶皱向纸张内部靠拢，直至被隐藏
                if (objWrinkle1.position.z <= 185 && info.name === 'objWrinkle1') {
                    objWrinkle1.position.z += 1
                }
                if (objWrinkle2.position.z <= 185 && info.name === 'objWrinkle2') {
                    objWrinkle2.position.z += 1
                }
                if (objWrinkle3.position.z <= 185 && info.name === 'objWrinkle3') {
                    objWrinkle3.position.z += 1
                }
                if (objWrinkle4.position.z <= 185 && info.name === 'objWrinkle4') {
                    objWrinkle4.position.z += 1
                }
                //刷子动画完成条件，即四个褶皱全部positon.x的位置小于等于1触发完成message
                if (objWrinkle1.position.z >= 183.3 && objWrinkle2.position.z >= 183.3 && objWrinkle3.position.z >= 183.3 && objWrinkle4.position.z >= 183.3) {
                    if (!ifFinish3) {
                        ifFinish3 = true
                        operate.pushElement(() => {
                            let div = document.createElement("div")
                            div.innerText = "3.刷纸完成，请双击继续"
                            return div
                        })
                    }
                }
            }
        }
    },
    ontouchendBrush: () => {
        ifup3 = false
    },
    //animate动画
    animateBrush: (cameraP) => {
        //假如objPaper2存在的情况下触发
        if (objPaper2) {
            let clubP = objPaper2.position.clone()
            //计算相机与墙上纸张的距离
            clubP.y = 12
            let distance2 = cameraP.distanceTo(clubP)
            //距离小于12 墙壁纸张出现 相机未固定 时触发
            if (distance2 <= 12 && ifPaper && !ifCameraP3) {
                //将相机锁定
                ifCameraP3 = true
                operate.pushElement(() => {
                    let div = document.createElement("div")
                    div.innerText = "2.请用手指缓慢划过褶皱，刷平纸面"
                    return div
                })
                operate.pushElement(() => {
                    let div = document.createElement('div')
                    let img = document.createElement('img')
                    img.src = image.pngShua
                    img.width = 200
                    img.height = 100
                    div.appendChild(img)
                    return div
                })
            }
        }
        //相机锁定的时候触发
        if (ifCameraP3) {
            //相机锁定位置
            camera.position.set(70, 12, 170)
        }
    }
}

function dispersed(size, name, box, position) {
    let geometry = new THREE.BoxBufferGeometry((box.max.x - box.min.x) * size, (box.max.y - box.min.y) * size, (box.max.z - box.min.z) * size)
    let material = new THREE.MeshBasicMaterial({opacity: 0, transparent: true})//wireframe: true,
    boxGltfClub = new THREE.Mesh(geometry, material)
    // mesh.position.set(
    //     position.x + (box.max.x + box.min.x) * size / 2,
    //     position.y + (box.max.y + box.min.y) * size / 2,
    //     position.z + (box.max.z + box.min.z) * size / 2)
    boxGltfClub.position.set(
        position.x,
        position.y,
        position.z)
    boxGltfClub.name = 'box_' + name
    scene.add(boxGltfClub)
}

//初始化init
export let initMakePaper = () => {
    // 初始化模型
    initOBJ()
    //重力加速度函数，获取手机xyz三个轴的重力加速度
    window.addEventListener('devicemotion', getGxyz, true)
    //单双击控制确认/取消 单击/取消 双击/确认
    //单击点击事件 取消动作
    container.addEventListener('click', oneClick, false)
    //双击点击事件 获取模型 确认动作
    container.addEventListener('dblclick', doubleClick, false)
    //长按事件
    container.addEventListener('touchstart', ontouchstart, false)
    container.addEventListener('touchmove', ontouchmove, false)
    container.addEventListener('touchend', ontouchend, false)
}

//初始化animate
export let animateMakePaper = (event) => {
    // console.log(gltfSifter.rotation.x)
    // gltfSifter.rotation.x+=0.01
    //水槽的水波浪
    let time = performance.now() * 0.001
    objWater.material.uniforms['time'].value += 1.0 / 2000.0
    let cameraP = camera.position
    //捞纸动作
    setLao.animateLao(cameraP)
    //搅拌动作
    setJiao.animateClub(cameraP)
    //刷纸动作
    setShua.animateBrush(cameraP)
}


//单击事件
function oneClick(event) {
    clearTimeout(clickTime)
    clickTime = setTimeout((event) => {
        //判断筛子是否在水槽上方
        setLao.oneClickLao()
        //判断棒子是否在水槽上方
        setJiao.oneClickClub()
        //判断纸张是否出现开始刷纸动画
        setShua.oneClickBrush()
    }, 300)
}

//双击事件
function doubleClick(event) {
    clearTimeout(clickTime)
    //双击获取模型信息
    let modelInfo = getRayObject(event.clientX, event.clientY)
    let modelName = modelInfo.name
    //双击筛子，将筛子放置水槽上方
    if (!ifGltfClub && !ifGltfBrush) {
        setLao.doubleClickLao(modelName)
    }

    //双击棒子，将棒子放置水槽上方
    if (!ifGlitfSifter && !ifGltfBrush) {
        setJiao.doubleClickClub(modelName)
    }

    if (!ifGltfClub && !ifGlitfSifter) {
        //双击刷子
        setShua.doubleClickBrush(modelInfo)
    }
}

//手指触摸开始事件
function ontouchstart(event) {
    setLao.ontouchstartLao()
    setJiao.ontouchstartClub()
    setShua.ontouchstartBrush()
}

//手指触摸移动事件
function ontouchmove(event) {
    event.preventDefault()
    let touch = event.touches[0]
    //刷纸动作动画
    setShua.ontouchmoveBrush(touch)
}

//手指触摸结束事件
function ontouchend() {
    setLao.ontouchendLao()
    setJiao.ontouchendClub()
    setShua.ontouchendBrush()
}

//初始化模型
function initOBJ() {
    //创建筛子
    setLao.createShaiZi()
    //创建木棒
    setJiao.createClub()
    //创建刷子
    setShua.createBrush()
    //创建纸堆
    setGroundPaper.createGroundPaper()

    //水槽
    createModel({
        gltf: true,
        url: model.waterChannel,
        name: 'gltfWaterChannel',
        function: (gltf) => {
            gltfWaterChannel = gltf
            gltf.position.set(30, 7, 120)
            gltf.scale.set(6, 6, 6)
            gltf.rotateY(Math.PI / 2)
            scene.add(gltf)
        }
    })

    //水槽的水
    let waterGeometry = new THREE.PlaneBufferGeometry(5, 12)
    objWater = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(image.water, function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping
            }),
            waterColor: 0xD0C0A6,
            fog: scene.fog !== undefined
        }
    )
    objWater.position.set(28, 5, 124)
    objWater.rotateX(-Math.PI / 2)
    objWater.name = "objWaterInChannel"
    scene.add(objWater)

    //桌子
    createModel({
        gltf: true,
        url: model.table,
        name: 'gltfTable',
        function: (gltf) => {
            gltfTable = gltf
            gltfTable.position.set(70, 0, 115)
            gltfTable.scale.set(0.8, 0.8, 0.8)
            gltfTable.rotation.y = Math.PI / 2
            scene.add(gltf)
        }
    })

    //筛子做出的纸
    objPaper = createModel({
        gltf: false,
        geometry: new THREE.BoxBufferGeometry(2.8, 7.5, 0),
        material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0, transparent: true}),
        textureLoaderUrl: image.paper,
        name: 'objPaper',
        function: (mesh) => {
            mesh.position.set(28, 5.2, 124)
            mesh.rotateX(Math.PI / 2)
            scene.add(mesh)
        }
    })

    //水桶1
    createModel({
        gltf: true,
        url: model.bigBucket,
        name: 'gltfBigBucket11',
        function: (gltf) => {
            gltfBigBucket11 = gltf
            gltf.position.set(75, 4, 115)
            gltf.scale.set(3, 3, 3)
            scene.add(gltf)
        }
    })

    //水桶2
    createModel({
        gltf: true,
        url: model.bigBucket,
        name: 'gltfBigBucket12',
        function: (gltf) => {
            gltfBigBucket12 = gltf
            gltf.position.set(76, 5, 119)
            gltf.scale.set(4, 4, 4)
            scene.add(gltf)
        }
    })
}

//将刷子与手指位置重合（仅针对刷子动画时，将刷子固定在墙纸面前）
function changeBrush(clientX, clientY) {
    let mv = new THREE.Vector3(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1,
        0.95).unproject(camera)
    //刷子固定在纸张前面
    // console.log(mv)
    return mv
}

//删除Mesh函数
function deleteMesh(obj) {
    obj.geometry.dispose()
    obj.material.dispose()
    scene.remove(obj)
    obj = null
}

//获取手机重力加速度
function getGxyz(evenData) {
    let acceleration = evenData.accelerationIncludingGravity
    gX = acceleration.x
    gY = acceleration.y
    gZ = acceleration.z
}

//褶皱函数
function makeBall(objWrinkle) {
    return createModel({
        gltf: false,
        geometry: new THREE.SphereGeometry(0.5, 50, 50),
        material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
        textureLoaderUrl: image.paper1,
        name: objWrinkle,
        function: (mesh) => {
            mesh.position.set(65 + Math.floor(Math.random() * 10), 8 + Math.floor(Math.random() * 21), 183)
            mesh.rotateY(Math.PI / 2)
            mesh.scale.set(2, 2, 2)
            selectedObjectsPaper.push(mesh)
            scene.add(mesh)
        }
    })
}