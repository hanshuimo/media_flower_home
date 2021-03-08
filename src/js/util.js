import * as THREE from 'three/build/three.module.js'
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js"
// import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {camera, model, scene, container, composer, renderer, outlinePass, selectedObjects} from "./index"
import {CustomGLTFLoader} from './poolClass.js'

export let modelNum = 0
//创建模型的通用方法
// let time = new Date().getTime()
export let createModel = function (json) {
    if (json["gltf"]) {
        // gltf,url,name,scene,function
        // new GLTFLoader().load(json["url"][0].url, (gltf) => {
        //     modelNum++
        //     gltf.scene.name = json["name"]
        //     json["function"](gltf.scene)
        //     // console.log(modelNum)
        //     // if(modelNum==21){
        //     //     console.log(new Date().getTime() - time)
        //     // }
        // })
        /*
        warning:
        gltf.children[0] Cannot get directly, need to set timer to get to again and delete timer
        */
        new CustomGLTFLoader(json['url'], 'model').load().then(gltf => {
            let time = setInterval(() => {
                if (gltf.children[0]) {
                    let model = gltf.children[0]
                    model.name = json["name"]
                    json["function"](model)
                    modelNum++
                    // console.log(modelNum)
                    clearInterval(time)
                    time = null
                }
            }, 60)
        })
    } else {
        //gltf,geometry,material,textureLoaderUrl,name,scene,function
        if (json["textureLoaderUrl"] != null) {
            json["material"].map = new THREE.TextureLoader().load(json["textureLoaderUrl"])
            json["material"].wrapS = json["material"].wrapT = THREE.RepeatWrapping
        }
        let mesh = new THREE.Mesh(json["geometry"], json["material"])
        mesh.name = json["name"]
        json["function"](mesh)
        return mesh
    }
}
//射线识别的通用方法
export let getRayObject = function (clientX, clientY) {
    let worldVector = changeClientToWorldVector(clientX, clientY, container, camera)
    // 射线投射方向单位向量(worldVector坐标减相机位置坐标)
    let ray = worldVector.sub(camera.position).normalize()
    // 创建射线投射器对象
    let rayCaster = new THREE.Raycaster(camera.position, ray)
    let result = null
    // 返回射线选中的对象数组(第二个参数默认值是false，意为是否遍历图形内部的所有子图形)
    let intersects = rayCaster.intersectObjects(scene.children, true)
    if (intersects.length > 0) {
        // 射线拾取的首个对象
        result = intersects[0].object
        // console.log(result)
        //处理导入的gltf模型会检测到内部模型的问题
        if (result.name.slice(0, 3) != "obj" && result.name.slice(0, 3) != "box") {
            result = result.parent
        }
    }
    return result
}
//检测距离脚底下最近模型的距离
export let getRayUnderDistance = function (position) {
    let verticalPosition = new THREE.Vector3(position.x, 0, position.z)
    // 射线投射方向单位向量(worldVector坐标减相机位置坐标)
    let ray = verticalPosition.sub(position).normalize()
    // 创建射线投射器对象
    let rayCaster = new THREE.Raycaster(position, ray, 0, 20)
    let result = null
    // 返回射线选中的对象数组(第二个参数默认值是false，意为是否遍历图形内部的所有子图形)
    let intersects = rayCaster.intersectObjects(scene.children, true)
    if (intersects.length > 0) {
        // // 射线拾取的首个对象
        // result = intersects[0].object
        // //处理导入的gltf模型会检测到内部模型的问题
        // while (result.name.slice(0, 4) != "gltf") {
        //     if(result.parent==null) break;
        //     result = result.parent
        // }
        result = intersects[0]
    }
    // console.log(result.object.name)
    return result
}
export let getRayFrontDistance = function (clientX, clientY) {
    let worldVector = changeClientToWorldVector(clientX, clientY, container, camera)
    // 射线投射方向单位向量(worldVector坐标减相机位置坐标)
    let ray = worldVector.sub(camera.position).normalize()
    // 创建射线投射器对象
    let rayCaster = new THREE.Raycaster(camera.position, ray, 0, 10)
    let result = null
    // 返回射线选中的对象数组(第二个参数默认值是false，意为是否遍历图形内部的所有子图形)
    let intersects = rayCaster.intersectObjects(scene.children, true)
    if (intersects.length > 0) {
        // 射线拾取的首个对象
        result = intersects[0].object
        // console.log(result)
        //处理导入的gltf模型会检测到内部模型的问题
        if (result.name.slice(0, 3) != "obj" && result.name.slice(0, 3) != "box") {
            result = result.parent
        }
    }
    return result
}
export let changeClientToWorldVector = function (clientX, clientY) {
    let x = ((clientX - container.getBoundingClientRect().left) / container.offsetWidth) * 2 - 1   // 设备横坐标
    let y = -((clientY - container.getBoundingClientRect().top) / container.offsetHeight) * 2 + 1  // 设备纵坐标
    // 标准设备坐标转为世界坐标
    return new THREE.Vector3(x, y, 1).unproject(camera)
}
//获取模型的大小
export let getSizeFromObject = function (object) {
    let box = new THREE.Box3().setFromObject(object)
    let x = box.max.x - box.min.x
    let y = box.max.y - box.min.y
    let z = box.max.z - box.min.z
    return new THREE.Vector3(x, y, z)
}
//吧模型包裹并且重置中点
export let changeObjectToCenter = function (object, bool) {
    let group = new THREE.Group()
    group.add(object)
    group.position.set(0, 0, 0)
    let box = new THREE.Box3().setFromObject(object)
    let x = (box.max.x + box.min.x) / 2
    let z = (box.max.z + box.min.z) / 2
    if (bool) {
        let y = (box.max.y + box.min.y) / 2
        object.position.set(-x, -y, -z)
    } else {
        object.position.set(-x, 0, -z)
    }
    return group
}
//object:需要检测的物体。list：会碰撞到的物理列表。optionLength:自定义碰撞迁移距离
export let collisionDetection = function (object, list, optionLength) {
    let originPoint = object.position
    let result = false
    for (let vertexIndex = 0; vertexIndex < object.geometry.vertices.length; vertexIndex++) {
        //获取object的其中一个顶点
        let localVertex = object.geometry.vertices[vertexIndex]
        // 顶点经过变换后的坐标
        let globalVertex = localVertex.applyMatrix4(object.matrix)
        // 获得由中心指向顶点的向量
        let directionVector = globalVertex.sub(originPoint)
        // 将方向向量初始化
        let ray = new THREE.Raycaster(originPoint, directionVector.normalize())
        // 检测射线与多个物体的相交情况
        let collisionResults = ray.intersectObjects(list, true)
        // debugger
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() + optionLength) {
            result = true
        }
    }
    return result
}
//消息提示的工具
export let showMessage = function (message, url, onProgress, cancel, confirm) {
    let time
    let objMessage = document.createElement("div")
    objMessage.setAttribute("class", "message")
    if (url != null) {
        let image = document.createElement("img")
        image.src = url
        objMessage.appendChild(image)
    }
    //message的div
    let div = document.createElement("div")
    div.innerHTML = message
    objMessage.appendChild(div)
    //提示的div
    let divTip = document.createElement("div")
    divTip.innerText = "双击进入，单击取消"
    objMessage.appendChild(divTip)
    document.getElementsByTagName("body")[0].appendChild(objMessage)
    onProgress()
    objMessage.addEventListener('click', () => {
        clearTimeout(time)
        time = setTimeout(() => {
            document.getElementsByTagName("body")[0].removeChild(objMessage)
            cancel()
        }, 300)
    }, false)
    objMessage.addEventListener('dblclick', () => {
        clearTimeout(time)
        document.getElementsByTagName("body")[0].removeChild(objMessage)
        confirm()
    }, false)
}

export let showOperate = function () {
    let obj = {}
    let time
    obj.objOperate = null
    obj.objOperateContent = null
    obj.objOperateTip = null
    obj.objListener = null
    obj.confirm = () => {
    }
    obj.cancel = () => {
    }
    obj.init = function () {
        if (document.getElementById("operate") !== null) return null
        let time
        obj.objOperate = document.createElement("div")
        obj.objOperate.setAttribute("id", "operate")
        obj.objOperate.setAttribute("class", "endMoveOperate")
        //创建内容提示分离
        obj.objOperateContent = document.createElement("div")
        obj.objOperateContent.setAttribute("id", "operateContent")
        obj.objOperate.appendChild(obj.objOperateContent)
        obj.objOperateTip = document.createElement("div")
        obj.objOperateTip.setAttribute("id", "operateTip")
        obj.objOperateTip.innerHTML = "双击面板此处继续<br>单击面板此处取消剧情"
        obj.objOperate.appendChild(obj.objOperateTip)
        document.getElementsByTagName("body")[0].appendChild(obj.objOperate)
        //单击container可以伸缩operate
        //touch
        // container
        obj.objListener = (event) => {
            if (obj.objOperate.getAttribute("class") === "startMoveOperate") {
                obj.objOperate.setAttribute("class", "endMoveOperate")
            } else {
                obj.objOperate.setAttribute("class", "startMoveOperate")
            }
        }
        container.addEventListener("click", obj.objListener, false)
        //初始化comfirm和cancel绑定的函数；
        obj.objOperateTip.addEventListener("dblclick", obj.confirm, false)
        obj.objOperateTip.addEventListener("click", obj.cancel, false)
        return obj
    }
    obj.pushAllAndPushElement = function (createElement, end) {
        obj.objOperateContent.innerHTML = ""
        let element = createElement()
        obj.objOperateContent.appendChild(element)
        if (end != null) end(element)
        return obj
    }
    obj.pushElement = function (createElement, end) {
        let element = createElement()
        obj.objOperateContent.appendChild(element)
        if (end != null) end(element)
        return obj
    }
    obj.deleteAppointElementByName = function (deleteElementText) {
        for (let i = 0; i < obj.objOperateContent.children.length; i++) {
            if (obj.objOperateContent.children[i].innerText === deleteElementText) {
                obj.objOperateContent.removeChild(obj.objOperateContent.children[i])
            }
        }
    }
    obj.getLastElement = function(){
        return obj.objOperateContent.lastChild;
    }
    obj.deleteLastElement = function () {
        obj.objOperateContent.removeChild(obj.objOperateContent.lastChild)
    }
    obj.pushConfirm = function (confirm) {
        obj.objOperateTip.removeEventListener("dblclick", obj.confirm, false)
        obj.confirm = () => {
            clearTimeout(time)
            //传入之前的运行函数可以制作多重函数
            confirm()
        }
        obj.objOperateTip.addEventListener("dblclick", obj.confirm, false)
    }
    obj.pushCancel = function (cancel) {
        obj.objOperateTip.removeEventListener("click", obj.cancel, false)
        obj.cancel = () => {
            clearTimeout(time)
            time = setTimeout(() => {
                //传入之前的运行函数可以制作多重函数
                cancel()
            }, 300)
        }
        obj.objOperateTip.addEventListener("click", obj.cancel, false)
    }
    obj.isEmpty = function () {
        if (obj.objOperate == null) return true
        else return false
    }
    obj.hide = function () {
        obj.objOperate.setAttribute("class", "startMoveOperate")
        return obj
    }
    obj.show = function () {
        this.objOperate.setAttribute("class", "endMoveOperate")
        return obj
    }
    obj.delete = function () {
        container.removeEventListener("click", obj.objListener, false)
        document.getElementsByTagName("body")[0].removeChild(obj.objOperate)
        obj.objOperate = null
        return obj
    }
    return obj
}
export let changeURL = (url) => {
    // return url
    return url.slice(23)
}
