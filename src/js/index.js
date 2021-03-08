import '../css/index.css'
import '../css/loading.css'
import 'literallycanvas/lib/css/literallycanvas.css'

const img = require("../../image/paint/index")

import * as THREE from 'three/build/three.module.js'
import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from "three/examples/jsm/objects/Sky.js"
import { DeviceOrientationControls } from "three/examples/jsm/controls/DeviceOrientationControls"
import {
    createModel,
    showMessage,
    showOperate,
    getRayObject,
    getRayUnderDistance,
    getRayFrontDistance,
    modelNum,
    changeURL
} from "./util"
import { CustomDB } from './dbClass.js'
import { initMakePaper, animateMakePaper } from "./makePaper"
import { initMakeFlower, animateMakeFlower } from "./makeFlower"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { initWebSocket } from "../api/websocket"
import {
    GodRaysFakeSunShader,
    GodRaysDepthMaskShader,
    GodRaysCombineShader,
    GodRaysGenerateShader
} from "three/examples/jsm/shaders/GodRaysShader.js"
import { AxesHelper } from "three"

//关于轮廓描边
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js"
import { $api } from "../api/api"
import { baseUrl } from "../api/axios"

export const model = require("./model.js")
export const image = require("./image.js")
export const video = require("./video.js")
export const container = document.getElementById('container')
export let camera, controls, scene, renderer, dControls, operate
export let ontouchstart
let sky, sun, water
let clock = new THREE.Clock()
//设置Phone/PC类型
let ifPhone = false
let cameraDirectionMethod = null
//设置长按移动
let ifCameraGo = false
let timeOutEvent = 0 //长按定时器
//房子模型
let gltfHouse
// selectedObjects
//轮廓描边
let composer, outlinePass
let audio
//export出一个数组，保存轮廓的模型
export let selectedObjectsPaper = []
export let selectedObjectsFlower = []
//雨天所用的变量
let rain = 0, rainList = [], rainBox = new THREE.Box3(
    //min
    new THREE.Vector3(-45, 0, -60),
    //max
    new THREE.Vector3(50, 0, 40)
)
// console.log(rainBox)
let rainDay = {
    createRain: (box3) => {
        let texture = new THREE.TextureLoader().load(image.raindrop)
        let geom = new THREE.Geometry()
        let material = new THREE.PointsMaterial({
            size: 1,
            opacity: true,
            map: texture,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            color: 0xffffff,
            morphTargets: true
        })
        let range = 500
        for (let i = 0; i < 5000; i++) {
            let particle = new THREE.Vector3(
                Math.random() * range - range / 2,
                Math.random() * range * 1.5,
                Math.random() * range - range / 2)
            particle.velocityY = 0.1 + Math.random() / 5
            particle.velocityX = (Math.random() - 0.5) / 3
            particle.velocityZ = (Math.random() - 0.5) / 3
            if (particle.x < box3.max.x && particle.x > box3.min.x && particle.z < box3.max.z && particle.z > box3.min.z) {

            } else {
                geom.vertices.push(particle)
            }
        }
        let system = new THREE.Points(geom, material)
        system.name = "system"
        system.sortParticles = true
        system.position.y = Math.random() * 100
        return system
    },
    initRain: () => {
        //雨
        for (let i = 0; i < 5; i++) {
            let rainObj = rainDay.createRain(rainBox)
            scene.add(rainObj)
            rainList.push(rainObj)
            rain = 1
        }
    },
    removeRain: () => {
        for (let i in rainList) {
            scene.remove(rainList[i])
            rainList[i].geometry.dispose()
            rainList[i].material.dispose()
        }
        rainList = []
    },
    defaultRain: () => {
        if (rain > 0) {
            let list = rainList
            for (let i = 0; i < list.length; i++) {
                list[i].position.y -= 1
                if (list[i].position.y < -50) {
                    let rainObj = rainDay.createRain(rainBox)
                    scene.add(rainObj)
                    scene.remove(list[i])
                    list[i].geometry.dispose() // 删除几何体
                    list[i].material.dispose() // 删除材质
                    rainList[i] = (rainObj)
                }
            }
        }
    },
    animateRain: () => {
    },
    changeRain: (rain) => {
        if (rain == 1) {
            rainDay.initRain()
            rainDay.animateRain = rainDay.defaultRain
        } else {
            rainDay.removeRain()
            rainDay.animateRain = () => {
            }
        }
    }
}
export let changeRain = rainDay.changeRain
//0晴天 1雨天
//0白天 1黑夜

//walk相关
let flag = 1
let lastCameraPosition = new THREE.Vector3(-20, 12, 165)//70,12,48.5//-20, 12, 165
let walkHeight = 10
let walkAnimateNum = 2


init()
animate()

function init() {
    //test
    // let test = document.createElement('div')
    // document.body.appendChild(test)
    // test.style.position = 'absolute'
    // test.style.zIndex = '99'
    // test.style.height = '100px'
    // test.style.width = '300px'
    // test.style.backgroundColor = 'red'
    // setInterval(()=>{
    //     test.innerText=modelNum
    // },60)
    //
    initBGM()
    initWebSocket()
    // initLoading()
    initDB()
    //登录弹出信息
    // initMessage()
    //初始化场景
    initScene()
    //初始化相机
    initCamera()
    //初始化渲染器
    initRenderer()
    //初始化轮廓显示
    initComposer()
    //初始化方式 PC/PHONE
    controlMethod()
    //初始化光线
    initLight()
    //初始化天空
    // initSky()
    //初始化水
    initWater()
    //初始化模型
    initObj()
    //初始化ROOM1
    initMakePaper()
    //初始化ROOM2
    initMakeFlower()
    //初始化operatew
    initOperate()
    //设置xyz坐标辅助线
    //green:y,red:x,blue:z
    // let helper = new AxesHelper(1000, 1000, 1000)
    // helper.name = "objHelper"
    // scene.add(helper)
}

function initLoading() {
    let loading = document.createElement("div")
    loading.setAttribute("class", "loading")
    let base = document.createElement("div")
    base.setAttribute("class", "base")
    let cube
    for (let i = 0; i < 9; i++) {
        cube = document.createElement("div")
        cube.setAttribute("class", "cube")
        base.appendChild(cube)
    }
    loading.appendChild(base)
    document.body.appendChild(loading)
    let interval = setInterval(() => {
        if (modelNum === 17) {
            setTimeout(() => {
                clearInterval(interval)
                document.body.removeChild(loading)
                initMessage()
            }, 500)

        }
    }, 100)
}

function initDB() {
    //创建数据库，数据库名称以及版本
    let paramsDB = { dbName: 'model', version: 1 }
    //数据表具体参数初始化
    let paramsStore = [
        {
            baseInfo: { 'storeName': 'bigBucket', 'keyPath': 'id', 'storeIfUp': false }
        },
        {
            baseInfo: { 'storeName': 'club', 'keyPath': 'id', 'storeIfUp': false }
        },
        {
            baseInfo: { 'storeName': 'desk', 'keyPath': 'id', 'storeIfUp': false }
        },
        {
            baseInfo: { 'storeName': 'frame', 'keyPath': 'id', 'storeIfUp': false }
        },
        {
            baseInfo: { 'storeName': 'waterChannel', 'keyPath': 'id', 'storeIfUp': false }
        },
        {
            baseInfo: { 'storeName': 'table', 'keyPath': 'id', 'storeIfUp': false }
        },
        {
            baseInfo: { 'storeName': 'laoZhi', 'keyPath': 'id', 'storeIfUp': false }
        },
        {
            baseInfo: { 'storeName': 'brush', 'keyPath': 'id', 'storeIfUp': false }
        },
        {
            baseInfo: { 'storeName': 'flowerHouse', 'keyPath': 'id', 'storeIfUp': false }
        },
        // {
        //   //数据表名称，主键，主键是否自动递增排序
        //   baseInfo: {'storeName': 'boat1', 'keyPath': 'id', 'storeIfUp': false},
        //   //传递数据表索引，键名：索引，键值：配置对象（说明该属性是否包含重复值）
        //   //模型名字，模型信息，模型位置信息
        //   // indexesInfo: {'arrayBuffer': true}
        // },
        // {
        //   //数据表名称，主键，主键是否自动递增排序
        //   baseInfo: {'storeName': 'boat2', 'keyPath': 'id', 'storeIfUp': false},
        //   //传递数据表索引，键名：索引，键值：配置对象（说明该属性是否包含重复值）
        //   //模型名字，模型信息，模型位置信息
        //   // indexesInfo: {'arrayBuffer': true}
        // },
    ]

    let db = new CustomDB(paramsDB, paramsStore)
    // setTimeout(() => {
    //     console.log(db)
    // }, 3000)
}

function initOperate() {
    operate = showOperate()
}

//轮廓
function initComposer() {
    composer = new EffectComposer(renderer)
    let renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera)
    composer.addPass(outlinePass)
    outlinePass.edgeStrength = 5
    outlinePass.edgeGlow = 0.5
    outlinePass.edgeThickness = 1
    outlinePass.pulsePeriod = 2
    outlinePass.visibleEdgeColor.set('#ffffff')
    outlinePass.hiddenEdgeColor.set('#ffffff')
}

function controlMethod() {
    if (ifPhone) {
        //初始化陀螺仪
        initDControl()
        //长按事件
        //长按1s开始移动
        // container.addEventListener('touchstart', ontouchstart, false)
        container.addEventListener('touchstart', touchstart, false)
        container.addEventListener('touchend', ontouchend, false)
        container.addEventListener('dblclick', doubleClickEvent, false)
        //陀螺仪移动方式
        cameraDirectionMethod = () => {
            dControls.update()
            if (ifCameraGo === true) {
                let direction = new THREE.Vector3()
                camera.getWorldDirection(direction)
                // 0.1
                camera.position.add(direction.multiplyScalar(0.5))
            }
        }
    } else {
        //初始化第一人称
        initFirstPerson()
        //鼠标移动获取模型信息
        container.addEventListener('mousemove', mousemove, false)
        //鼠标点击获取模型信息
        container.addEventListener('click', clickEvent, false)
        //鼠标双击触发任务事件
        container.addEventListener('dblclick', doubleClickEvent, false)
        //第一人称移动方式
        cameraDirectionMethod = () => {
            controls.update(clock.getDelta())
        }
    }
}

// ontouchstart = (event) => {
//   // event.preventDefault();
//   if (event.touches.length == 1) {
//     timeOutEvent = setTimeout(() => {
//       timeOutEvent = 0
//       ifCameraGo = true
//     }, 1000)
//   }
//   return false
// }

function touchstart(event) {
    if (event.touches.length == 1) {
        timeOutEvent = setTimeout(() => {
            timeOutEvent = 0
            ifCameraGo = true
        }, 1000)
    }
}

function ontouchend() {
    clearTimeout(timeOutEvent)//清除定时器
    timeOutEvent = 0
    ifCameraGo = false
}

function clickEvent(event) {
    // console.log(getRayObject(event, scene, camera, false))
    // console.log(getRayObject(event.clientX, event.clientY))
}

function mousemove(event) {

}

function doubleClickEvent(event) {
    // let res = getRayObject(event.clientX, event.clientY)
    // console.log(res)
}

function animate() {
    requestAnimationFrame(animate)
    // console.log(camera.position)
    // camera.position.x+=0.1
    //轮廓发光
    outlinePass.selectedObjects = [...selectedObjectsPaper, ...selectedObjectsFlower]
    let time = performance.now() * 0.001
    water.material.uniforms['time'].value += 2.0 / 1000.0
    animateMakePaper()
    animateMakeFlower()
    //控制相机
    cameraRender()
    rainDay.animateRain()
}

function cameraRender() {
    composer.render(scene, camera)
    // renderer.render(scene, camera)
    if (flag === 1) {
        flag = flag + 1
        if (!camera.position.equals(lastCameraPosition)) {
            walkBoundary()
            lastCameraPosition = camera.position.clone()
        }
    } else if (flag === walkAnimateNum) {
        flag = 1
    } else {
        flag = flag + 1
    }
    cameraDirectionMethod()
    // if(result.object.name)
}

function walkBoundary() {
    let result = getRayUnderDistance(camera.position)
    //todo 可能会走到墙外
    let resultFront = getRayFrontDistance(renderer.domElement.width / 2, renderer.domElement.height / 2)
    if (result.object.name.slice(0, 4) === "walk") {
        camera.position.y = camera.position.y - (result.distance - walkHeight)
    } else {
        camera.position.x = lastCameraPosition.x
        camera.position.y = lastCameraPosition.y
        camera.position.z = lastCameraPosition.z
    }
    if (resultFront) {
        camera.position.x = lastCameraPosition.x
        camera.position.y = lastCameraPosition.y
        camera.position.z = lastCameraPosition.z
    }
    // console.log(resultFront)
}

function initBGM() {
    audio = document.createElement('audio')
    audio.src = video.BGM
    audio.loop = 'loop'
    audio.volume = 1
    document.body.appendChild(audio)
}

function initMessage() {
    showMessage('转动视角：移动手机。<br/>前进：长按场景。<br/>隐藏/显示操作小提示：单击场景。<br/>开启任务：双击发光模型，感受花草纸的魅力吧！', null, () => {
    }, () => {
        audio.play()
        dControls.connect()
    }, () => {
        audio.play()
        dControls.connect()
    })
}

function initScene() {
    scene = new THREE.Scene()
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    // camera.position.set(27, 12, -14)
    // camera.position.set(70, 12, 120)
    camera.position.set(lastCameraPosition.x, lastCameraPosition.y, lastCameraPosition.z)
    // console.log(camera)
}

function initFirstPerson() {
    controls = new FirstPersonControls(camera)
    controls.enabled = true
    controls.lookSpeed = 0.1 //鼠标移动查看的速度
    controls.movementSpeed = 30 //相机移动速度
    controls.noFly = false
    controls.constrainVertical = true //约束垂直
    controls.verticalMin = 1.0
    controls.verticalMax = 2.0
    controls.lon = 0 //进入初始视角x轴的角度
    controls.lat = 0 //初始视角进入后y轴的角度
    // controls = new OrbitControls(camera, renderer.domElement)
    // // controls.target.set(70, 12, 1500)
}

function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0xEEEEEE, 1)
    container.appendChild(renderer.domElement)
}

function initDControl() {
    dControls = new DeviceOrientationControls(camera)
}

function initLight() {
    //光线,环境光，点光
    const ambient = new THREE.AmbientLight(0xFFFFFF)
    ambient.name = "objAmbientLight"
    scene.add(ambient)
    // const directionalLight = new THREE.DirectionalLight(0xFFFFCC, 0.2)
    // directionalLight.name = "objDirectionalLight"
    // directionalLight.position.set(0, 20, -100)
    // scene.add(directionalLight)
}

function initSky() {
    sky = new Sky()
    sky.name = "objSky"
    sky.scale.setScalar(1000)
    scene.add(sky)

    sun = new THREE.Vector3()
    //改天气
    const effectController = {
        turbidity: 100,
        rayleigh: 0.5,
        mieCoefficient: 0.0005,
        mieDirectionalG: 50,
        inclination: 0.49,
        azimuth: 0.25,
        exposure: renderer.toneMappingExposure
    }

    function guiChanged() {

        let uniforms = sky.material.uniforms
        uniforms["turbidity"].value = effectController.turbidity
        uniforms["rayleigh"].value = effectController.rayleigh
        uniforms["mieCoefficient"].value = effectController.mieCoefficient
        uniforms["mieDirectionalG"].value = effectController.mieDirectionalG
        let theta
        // let nowTime = new Date().getHours()
        // if (nowTime <= 18 && nowTime >= 6) {
        //     theta = Math.PI * (effectController.inclination - 0.5) * (nowTime - 6) * 25 / 3
        // } else {
        //     theta = Math.PI * (effectController.inclination - 0.5) * -1
        // }
        if (getWeather === '1') {
            console.log('weather')
            theta = Math.PI * (effectController.inclination - 0.5)
        } else {
            theta = Math.PI * (effectController.inclination - 0.5) * (15 - 6) * 25 / 3
        }
        // let theta = Math.PI * (effectController.inclination - 0.5)
        let phi = 2 * Math.PI * (effectController.azimuth - 0.5)
        // console.log(new Date().getHours())

        sun.x = Math.cos(phi)
        sun.y = Math.sin(phi) * Math.sin(theta)
        sun.z = Math.sin(phi) * Math.cos(theta)

        uniforms["sunPosition"].value.copy(sun)

        renderer.render(scene, camera)

    }

    guiChanged()
}

export function changeSky(weather) {
    sky = null
    sun = null
    if (weather == 1) {
        initSkyNight()
    } else {
        initSkyNoon()
    }
}

function initSkyNoon() {
    sky = new Sky()
    sky.name = "objSky"
    sky.scale.setScalar(1000)
    scene.add(sky)

    sun = new THREE.Vector3()
    //改天气
    const effectController = {
        turbidity: 100,
        rayleigh: 0.5,
        mieCoefficient: 0.0005,
        mieDirectionalG: 50,
        inclination: 0.49,
        azimuth: 0.25,
        exposure: renderer.toneMappingExposure
    }

    function guiChanged() {

        let uniforms = sky.material.uniforms
        uniforms["turbidity"].value = effectController.turbidity
        uniforms["rayleigh"].value = effectController.rayleigh
        uniforms["mieCoefficient"].value = effectController.mieCoefficient
        uniforms["mieDirectionalG"].value = effectController.mieDirectionalG
        let theta
        // let nowTime = new Date().getHours()
        // if (nowTime <= 18 && nowTime >= 6) {
        //     theta = Math.PI * (effectController.inclination - 0.5) * (nowTime - 6) * 25 / 3
        // } else {
        //     theta = Math.PI * (effectController.inclination - 0.5) * -1
        // }
        // if (getWeather === '1') {
        //   console.log('weather')
        //   theta = Math.PI * (effectController.inclination - 0.5)
        // } else {
        theta = Math.PI * (effectController.inclination - 0.5) * (15 - 6) * 25 / 3
        // }
        // let theta = Math.PI * (effectController.inclination - 0.5)
        let phi = 2 * Math.PI * (effectController.azimuth - 0.5)
        // console.log(new Date().getHours())

        sun.x = Math.cos(phi)
        sun.y = Math.sin(phi) * Math.sin(theta)
        sun.z = Math.sin(phi) * Math.cos(theta)

        uniforms["sunPosition"].value.copy(sun)

        renderer.render(scene, camera)

    }

    guiChanged()
}

function initSkyNight() {
    sky = new Sky()
    sky.name = "objSky"
    sky.scale.setScalar(1000)
    scene.add(sky)

    sun = new THREE.Vector3()
    //改天气
    const effectController = {
        turbidity: 100,
        rayleigh: 0.5,
        mieCoefficient: 0.0005,
        mieDirectionalG: 50,
        inclination: 0.49,
        azimuth: 0.25,
        exposure: renderer.toneMappingExposure
    }

    function guiChanged() {

        let uniforms = sky.material.uniforms
        uniforms["turbidity"].value = effectController.turbidity
        uniforms["rayleigh"].value = effectController.rayleigh
        uniforms["mieCoefficient"].value = effectController.mieCoefficient
        uniforms["mieDirectionalG"].value = effectController.mieDirectionalG
        let theta
        // let nowTime = new Date().getHours()
        // if (nowTime <= 18 && nowTime >= 6) {
        //     theta = Math.PI * (effectController.inclination - 0.5) * (nowTime - 6) * 25 / 3
        // } else {
        //     theta = Math.PI * (effectController.inclination - 0.5) * -1
        // }
        // console.log('weather')
        theta = Math.PI * (effectController.inclination - 0.5)
        // let theta = Math.PI * (effectController.inclination - 0.5)
        let phi = 2 * Math.PI * (effectController.azimuth - 0.5)
        // console.log(new Date().getHours())

        sun.x = Math.cos(phi)
        sun.y = Math.sin(phi) * Math.sin(theta)
        sun.z = Math.sin(phi) * Math.cos(theta)

        uniforms["sunPosition"].value.copy(sun)

        renderer.render(scene, camera)

    }

    guiChanged()
}

function initWater() {
    let waterGeometry = new THREE.PlaneBufferGeometry(600, 600)
    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(image.water, function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping
            }),
            waterColor: 0x93b5cf,
            fog: scene.fog !== undefined
        }
    )
    water.name = "objWater"
    water.rotation.x = -Math.PI / 2
    // water.position.y = -1.5
    water.position.set(10, 0, 10)
    // console.log(water)
    scene.add(water)
}

function initObj() {
    new GLTFLoader().load(model.flowerHouse, (gltf) => {
        gltf.name = 'gltfFlowerHouse'
        gltfHouse = gltf.scene
        gltfHouse.position.set(0, 0, 0)
        gltfHouse.scale.set(10, 10, 10)
        scene.add(gltfHouse)
    })
}


