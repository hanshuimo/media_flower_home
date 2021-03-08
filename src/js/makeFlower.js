import canvas2image from 'canvas2image'
import {
  camera,
  controls,
  scene,
  renderer,
  container,
  dControls,
  operate,
  model,
  image,
  selectedObjectsFlower,
  ontouchstart,
} from "./index"
import {
  createModel,
  getRayObject,
  changeClientToWorldVector,
  getSizeFromObject,
  changeObjectToCenter,
  collisionDetection,
  showMessage,
  changeURL
} from "./util"
import * as THREE from 'three/build/three.module.js'

const LC = require('literallycanvas')
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js"
import {DragControls} from './CustomDragControls'
import {TransformControls} from 'three/examples/jsm/controls/TransformControls'
import {$api} from "../api/api.js"

let gltfDesk, gltfDeskFrame, objDeskFramePaper, objDeskFrameBall, objPaperTextureList = []
//animateFunctionJson用于animate渲染，lastWorldVectorTranslation用于单指平移
let animateFunctionJson = {}, lastWorldVectorTranslation = new THREE.Vector3
//scale缩放
let lastLengthScale
//计算保存画框、纸张的位置
let setDeskFramePaper, setPaper
//花草纸数据位置传递
let allInfo = [{"index": 1, "url": null, "coordinate": null, "scale": null}, {
  "index": 2,
  "url": null,
  "coordinate": null,
  "scale": null
}]
let ifCamera = false, objPaper, objText

let makeFlowerOperateContent = [
    "1.请选择文件，双击下方上传文件",
    "正在上传图片，加工处理，请稍后",
    '2.请移动/缩放图片至合适大小',
    '3.请在绘图板上题名',
    '4.请移动/缩放图片至合适大小',
    '5.制作完成，请等待管理员审核，请双击继续',
    "文件已经选定，请双击下方上传至服务器",
    "不好意思，服务器忙，请取消剧情重试。",
    "网络错误，请取消剧情重试。"
]
let wallPosition = [
  new THREE.Vector3(-29.5,15,-32.7), new THREE.Vector3(-23,15,-32.7),
  new THREE.Vector3(-15,15,-32.7), new THREE.Vector3(-8,15,-32.7),
  new THREE.Vector3(1,15,-32.7), new THREE.Vector3(10,15,-32.7),
  new THREE.Vector3(20,15,-32.7), new THREE.Vector3(29,15,-32.7),
]
let gltfWallFrameList = []
let objWallFramePaperList = []
let wallGroup = []
let frameGroup = []

export let initMakeFlower = () => {
  initObj()
  container.addEventListener('click', clickEvent, false)
  container.addEventListener('dblclick', doubleClickEvent, false)
}
export let animateMakeFlower = () => {
  //相机固定在桌子前
  if (ifCamera)
    camera.position.set(70,12,48.5);
  for (let key in animateFunctionJson) {
    if (key === "animateTouchMoveTranslationFunction") {
      animateFunctionJson[key](lastWorldVectorTranslation)
    } else if (key === "animateTouchMoveScaleFunction") {
      animateFunctionJson[key](lastLengthScale)
    }
  }
}

function uploadPicture() {
  let time
  //判断图库是否打开
  // let ifPicture = true
  let formFile = document.getElementById("file")
  formFile.addEventListener("change",()=>{
    console.log(formFile.files[0])
    if(operate.getLastElement().innerText === makeFlowerOperateContent[0]&&formFile.files[0]){
      operate.pushElement(()=>{
        let div = document.createElement("div")
        div.innerText = makeFlowerOperateContent[6]
        return div
      }).pushConfirm(()=>{
        operate.pushConfirm(()=>{})
        document.getElementById("submit").click();
      })
    }
  })
  if (operate.isEmpty()) {
    operate.init().pushElement(() => {
      let div = document.createElement("div")
      div.innerText = makeFlowerOperateContent[0]
      return div
    }, () => {
      operate.pushConfirm(() => {
        // if (ifPicture) {
          formFile.click()
        //   ifPicture = false
        // } else {
        //   document.getElementById("submit").click()
        // }
      });
      operate.pushCancel(() => {
        operate.delete()
        formFile.value = '';
        ifCamera = false;
      })
    })
  }
  document.getElementById("submit").onclick = () => {
    let fileObj = document.getElementById("file")
    console.log(fileObj.files[0])
    let params = {
      file: fileObj.files[0]
    }
    operate.deleteLastElement();
    operate.pushElement(() => {
      let div = document.createElement('div')
      div.innerText = makeFlowerOperateContent[1]
      return div
    })
    $api.uploadFlower(params).then(res => {
      console.log(res)
      if (res.code === '00000') {
        allInfo[0].url = res.data.url
        console.log(changeURL(res.data.url))
        createModel({
          gltf: false,
          geometry: new THREE.BoxBufferGeometry(1, 1, 0),
          material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
          textureLoaderUrl: changeURL(res.data.url),
          name: 'objPaperTexture',
          function: (mesh) => {
            objPaper = mesh
            //70,7.3,48.5
            mesh.position.set(70,7.37,48.5)//7.3  4.37
            mesh.scale.set(1, 1, 1)
            mesh.rotation.set(Math.PI / 2, 0, -Math.PI / 2)
            scene.add(mesh)
            objPaperTextureList[0] = mesh
          }
        })
        setPaper = new THREE.Box3().setFromObject(objPaperTextureList[0])
        setDeskFramePaper = new THREE.Box3().setFromObject(objDeskFramePaper)
        // console.log(setDeskFramePaper, setPaper)
        let dx = setDeskFramePaper.max.x - setDeskFramePaper.min.x
        let dz = setDeskFramePaper.max.z - setDeskFramePaper.min.z
        let px = setPaper.max.x - setPaper.min.x
        let pz = setPaper.max.z - setPaper.min.z
        // console.log(dx, dz, px, pz)
        if (px - dx > pz - dz) {
          objPaperTextureList[0].scale.x = dx / px
          objPaperTextureList[0].scale.y = dx / px
          objPaperTextureList[0].scale.z = dx / px
        } else {
          objPaperTextureList[0].scale.x = dz / pz
          objPaperTextureList[0].scale.y = dz / pz
          objPaperTextureList[0].scale.z = dz / pz
        }
        container.addEventListener('touchstart', touchstartEvent, false)
        operate.deleteLastElement();
        operate.pushElement(() => {
          let div = document.createElement('div')
          div.innerText = makeFlowerOperateContent[2]
          return div
        })
        operate.pushConfirm(() => {
          container.removeEventListener('touchstart', touchstartEvent)
          allInfo[0].scale = objPaperTextureList[0].scale.x
          allInfo[0].coordinate = '(' + (objDeskFramePaper.position.x - objPaperTextureList[0].position.x) + ',' + (objDeskFramePaper.position.z - objPaperTextureList[0].position.z) + ')'
          initLC()
        })
        operate.pushCancel(() => {
          operate.delete()
          document.getElementById("file").value = '';
          ifCamera = false
          scene.remove(objPaper)
          // ifPicture = true
          objPaper = null
        })
      }else{
        operate.deleteLastElement();
        operate.pushElement(() => {
          let div = document.createElement('div')
          div.innerText = makeFlowerOperateContent[7]
          return div
        })
      }

    }).catch(res => {
      console.log(res)
      operate.deleteLastElement();
      operate.pushElement(() => {
        let div = document.createElement('div')
        div.innerText = makeFlowerOperateContent[8]
        return div
      })
    })
  }
  // document.getElementById('submit').ondblclick = () => {
  //   clearTimeout(time)
  // }
  function initLC() {
    operate.pushElement(() => {
      let div = document.createElement('div')
      div.innerText = makeFlowerOperateContent[3]
      return div
    })
    operate.pushElement(() => {
      let div = document.createElement("div")
      div.setAttribute("id", "canvas")
      return div
    }, (obj) => {
      LC.init(obj, {imageURLPrefix: "../images/"})
      console.log(LC)
    })
    operate.pushConfirm(() => {
          let canvas = document.getElementById('canvas').getElementsByTagName('canvas')[1]
          let imgURL = canvas.toDataURL("image/png")
          let imgArray = searchWhite(canvas)
          let img = new Image()
          img.src = imgURL
          let newCanvas = document.createElement('canvas')
          let newCtx = newCanvas.getContext('2d')
          img.onload = () => {
            newCtx.drawImage(img, imgArray[0], imgArray[2], imgArray[1] - imgArray[0], imgArray[3] - imgArray[2], 0, 0, newCanvas.width, newCanvas.height)
            let newImgURL = newCanvas.toDataURL('image/png')
            let deleteDiv = document.getElementById('canvas')
            if (newImgURL) deleteDiv.parentNode.removeChild(deleteDiv)
            let params = {
              base64file: newImgURL
            }
            operate.pushElement(() => {
              let div = document.createElement('div')
              div.innerText = makeFlowerOperateContent[1]
              return div
            }).pushConfirm(()=>{})
            $api.uploadCharacter(params).then(res => {
              console.log(res)
              if (res.code === '00000') {
                allInfo[1].url = res.data.url
                let texture = THREE.ImageUtils.loadTexture(changeURL(res.data.url), {}, function () {
                  renderer.render(scene, camera)
                })
                // 材质
                let material = new THREE.MeshLambertMaterial({
                  map: texture,
                  color: 0xffff00,
                  depthTest: false,
                  depthWrite: false
                })
                material.side = THREE.DoubleSide
                material.transparent = true
                // 几何体
                objText = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 32), material)
                objText.position.set(70, 7.4, 48.5)//70,7.37,48.5
                // objText.position.set(28, 4.38, -38)
                objText.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2)
                objText.name = 'objTextTexture'
                scene.add(objText)
                objPaperTextureList.push(objText)
                container.addEventListener('touchstart', touchstartEvent1, false)
                operate.deleteLastElement();
                operate.pushElement(() => {
                  let div = document.createElement('div')
                  div.innerText = makeFlowerOperateContent[4]
                  return div
                })
                operate.pushConfirm(() => {
                  container.removeEventListener('touchstart', touchstartEvent1)
                  allInfo[1].scale = objPaperTextureList[1].scale.x
                  allInfo[1].coordinate = '(' + (objDeskFramePaper.position.x - objPaperTextureList[1].position.x) + ',' + (objDeskFramePaper.position.z - objPaperTextureList[1].position.z) + ')'
                  // console.log(allInfo)
                  operate.pushConfirm(()=>{})
                  $api.savePositions(allInfo).then(res => {
                    if (res.code === '00000') {
                      operate.pushElement(() => {
                        let div = document.createElement('div')
                        div.innerText = makeFlowerOperateContent[5]
                        return div
                      })
                      operate.pushConfirm(() => {
                        operate.delete()
                        document.getElementById("file").value = '';
                        ifCamera = false
                        scene.remove(objPaper)
                        scene.remove(objText)
                        objPaper = null
                        objText = null
                      })
                    }else{
                      operate.pushElement(() => {
                        let div = document.createElement('div')
                        div.innerText = makeFlowerOperateContent[7]
                        return div
                      })
                    }
                  }).catch(res => {
                    console.log(res)
                    operate.pushElement(() => {
                      let div = document.createElement('div')
                      div.innerText = makeFlowerOperateContent[8]
                      return div
                    })
                  })
                })
                operate.pushCancel(() => {
                  operate.delete()
                  document.getElementById("file").value = '';
                  ifCamera = false
                  scene.remove(objPaper)
                  scene.remove(objText)
                  objPaper = null
                  objText = null
                  // ifPicture = true
                })
              }else{
                operate.deleteLastElement();
                operate.pushElement(() => {
                  let div = document.createElement('div')
                  div.innerText = makeFlowerOperateContent[7]
                  return div
                })
              }
            }).catch(res => {
              console.log(res)
              operate.deleteLastElement();
              operate.pushElement(() => {
                let div = document.createElement('div')
                div.innerText = makeFlowerOperateContent[8]
                return div
              })
            })
          }
        }
    )
    operate.pushCancel(() => {
      operate.delete()
      document.getElementById("file").value = '';
      ifCamera = false
      scene.remove(objPaper)
      // ifPicture = true
    })
  }
}

function clickEvent(event) {
}

function doubleClickEvent(event) {
  // clearTimeout(time)
  if (getRayObject(event.clientX, event.clientY).name === "objDeskFramePaper") {
    showMessage("进入印花纸制作工序：上传图片为印花纸找一份精美的印花吧！", null, () => {
    }, () => {
    }, () => {
      uploadPicture()
      ifCamera = true
    })
  }
}

function touchstartEvent(event) {
  //单指平移
  if (event.touches.length === 1) {
    // event.preventDefault()
    let touchPointOne, worldVector
    touchPointOne = event.targetTouches[0]
    if (getRayObject(touchPointOne.clientX, touchPointOne.clientY).name !== "objPaperTexture") return true
    // dControls.enabled = false;
    // container.removeEventListener("touchstart", ontouchstart, false)
    //初始化lastWorldVectorTranslation
    lastWorldVectorTranslation = changeClientToWorldVector(touchPointOne.clientX, touchPointOne.clientY)
    //用于恢复位置
    let originPosition = objPaperTextureList[0].position
    //定义touchmove函数
    let touchmove = (event) => {
      touchPointOne = event.targetTouches[0]
      worldVector = changeClientToWorldVector(touchPointOne.clientX, touchPointOne.clientY)
      let animateTouchMoveTranslationFunction = (lastVector) => {
        objPaperTextureList[0].position.x += (worldVector.x - lastVector.x) / 1000
        objPaperTextureList[0].position.z += (worldVector.z - lastVector.z) / 1000
        delete animateFunctionJson["animateTouchMoveTranslationFunction"]
        lastWorldVectorTranslation = worldVector
      }
      animateFunctionJson["animateTouchMoveTranslationFunction"] = animateTouchMoveTranslationFunction
    }
    container.addEventListener("touchmove", touchmove, false)
    let time = false
    container.addEventListener("touchend", () => {
      // dControls.enabled = true;
      container.removeEventListener("touchmove", touchmove, false)
      //碰撞检测
      let objPaperTexturePoint = new THREE.Box3().setFromObject(objPaperTextureList[0])
      //框
      let gltfDeskFramePoint = new THREE.Box3().setFromObject(objDeskFramePaper)
      // console.log(objPaperTexturePoint)
      // console.log('1111')
      // console.log(gltfDeskFramePoint)
      // if(collisionDetection(objPaperTextureList[0],[gltfDeskFrame],0.5)){射线检测的方法
      if (objPaperTexturePoint.max.x > gltfDeskFramePoint.max.x - 0.2) {
        console.log("发生了碰撞")
        objPaperTextureList[0].position.x = gltfDeskFramePoint.max.x
          - (objPaperTexturePoint.max.x - objPaperTexturePoint.min.x) / 2
      }
      if (objPaperTexturePoint.min.x < gltfDeskFramePoint.min.x + 0.2) {
        console.log("发生了碰撞")
        objPaperTextureList[0].position.x = gltfDeskFramePoint.min.x
          + (objPaperTexturePoint.max.x - objPaperTexturePoint.min.x) / 2
      }
      if (objPaperTexturePoint.max.z > gltfDeskFramePoint.max.z - 0.2) {
        console.log("发生了碰撞")
        objPaperTextureList[0].position.z = gltfDeskFramePoint.max.z
          - (objPaperTexturePoint.max.z - objPaperTexturePoint.min.z) / 2
      }
      if (objPaperTexturePoint.min.z < gltfDeskFramePoint.min.z + 0.2) {
        console.log("发生了碰撞")
        objPaperTextureList[0].position.z = gltfDeskFramePoint.min.z
          + (objPaperTexturePoint.max.z - objPaperTexturePoint.min.z) / 2
      }
      setTimeout(() => {
        time = false
      }, 300)
      // container.addEventListener("touchstart", ontouchstart, false)
    })
  }
  //双指缩放
  else if (event.touches.length === 2) {
    event.preventDefault()
    // dControls.enabled = false;
    // container.removeEventListener("touchstart", ontouchstart, false)
    let touchPointOne, touchPointTwo
    touchPointOne = event.targetTouches[0]
    touchPointTwo = event.targetTouches[1]
    lastLengthScale = new THREE.Vector3(touchPointOne.clientX, touchPointOne.clientY, 0)
      .distanceTo(new THREE.Vector3(touchPointTwo.clientX, touchPointOne.clientY, 0))
    //限制缩放
    let objPaperTexturePoint = new THREE.Box3().setFromObject(objPaperTextureList[0])
    let gltfDeskFramePoint = new THREE.Box3().setFromObject(gltfDeskFrame)
    let scale = ((objPaperTextureList[0].scale.x
      * (gltfDeskFramePoint.max.x - gltfDeskFramePoint.min.x) / (objPaperTexturePoint.max.x - objPaperTexturePoint.min.x)).toFixed(2))
    let touchmove = (event) => {
      touchPointOne = event.targetTouches[0]
      touchPointTwo = event.targetTouches[1]
      let length = new THREE.Vector3(touchPointOne.clientX, touchPointOne.clientY, 0)
        .distanceTo(new THREE.Vector3(touchPointTwo.clientX, touchPointOne.clientY, 0))
      let animateTouchMoveScaleFunction = (lastLength) => {
        let ratio = (length / lastLength).toFixed(2)
        if ((objPaperTextureList[0].scale.x + (ratio - 1) / 5) < scale) {
          objPaperTextureList[0].scale.x += (ratio - 1) / 5
          objPaperTextureList[0].scale.y += (ratio - 1) / 5
          lastLengthScale = length
        }
        delete animateFunctionJson["animateTouchMoveScaleFunction"]
      }
      animateFunctionJson["animateTouchMoveScaleFunction"] = animateTouchMoveScaleFunction
    }
    container.addEventListener("touchmove", touchmove, false)
    container.addEventListener("touchend", () => {
      // dControls.enabled = true;
      container.removeEventListener("touchmove", touchmove, false)
      // container.addEventListener("touchstart", ontouchstart, false)
    })
  }
}

function touchstartEvent1(event) {
  //单指平移
  if (event.touches.length === 1) {
    // event.preventDefault()
    let touchPointOne, worldVector
    touchPointOne = event.targetTouches[0]
    if (getRayObject(touchPointOne.clientX, touchPointOne.clientY).name !== "objTextTexture") return true
    // dControls.enabled = false;
    // container.removeEventListener("touchstart", ontouchstart, false)
    //初始化lastWorldVectorTranslation
    lastWorldVectorTranslation = changeClientToWorldVector(touchPointOne.clientX, touchPointOne.clientY)
    //用于恢复位置
    let originPosition = objPaperTextureList[1].position
    //定义touchmove函数
    let touchmove = (event) => {
      touchPointOne = event.targetTouches[0]
      worldVector = changeClientToWorldVector(touchPointOne.clientX, touchPointOne.clientY)
      let animateTouchMoveTranslationFunction = (lastVector) => {
        objPaperTextureList[1].position.x += (worldVector.x - lastVector.x) / 1000
        objPaperTextureList[1].position.z += (worldVector.z - lastVector.z) / 1000
        delete animateFunctionJson["animateTouchMoveTranslationFunction"]
        lastWorldVectorTranslation = worldVector
      }
      animateFunctionJson["animateTouchMoveTranslationFunction"] = animateTouchMoveTranslationFunction
    }
    container.addEventListener("touchmove", touchmove, false)
    let time = false
    container.addEventListener("touchend", () => {
      // dControls.enabled = true;
      container.removeEventListener("touchmove", touchmove, false)
      //碰撞检测
      let objPaperTexturePoint = new THREE.Box3().setFromObject(objPaperTextureList[1])
      let gltfDeskFramePoint = new THREE.Box3().setFromObject(objDeskFramePaper)
      // console.log(objPaperTexturePoint, gltfDeskFramePoint)
      // if(collisionDetection(objPaperTextureList[0],[gltfDeskFrame],0.5)){射线检测的方法
      if (objPaperTexturePoint.max.x > gltfDeskFramePoint.max.x - 0.2) {
        console.log("发生了碰撞")
        objPaperTextureList[1].position.x = gltfDeskFramePoint.max.x
          - (objPaperTexturePoint.max.x - objPaperTexturePoint.min.x) / 2
      }
      if (objPaperTexturePoint.min.x < gltfDeskFramePoint.min.x + 0.2) {
        console.log("发生了碰撞")
        objPaperTextureList[1].position.x = gltfDeskFramePoint.min.x
          + (objPaperTexturePoint.max.x - objPaperTexturePoint.min.x) / 2
      }
      if (objPaperTexturePoint.max.z > gltfDeskFramePoint.max.z - 0.2) {
        console.log("发生了碰撞")
        objPaperTextureList[1].position.z = gltfDeskFramePoint.max.z
          - (objPaperTexturePoint.max.z - objPaperTexturePoint.min.z) / 2
      }
      if (objPaperTexturePoint.min.z < gltfDeskFramePoint.min.z + 0.2) {
        console.log("发生了碰撞")
        objPaperTextureList[1].position.z = gltfDeskFramePoint.min.z
          + (objPaperTexturePoint.max.z - objPaperTexturePoint.min.z) / 2
      }
      setTimeout(() => {
        time = false
      }, 300)
      // container.addEventListener("touchstart", ontouchstart, false)
    })
  }
  //双指缩放
  else if (event.touches.length === 2) {
    event.preventDefault()
    // dControls.enabled = false;
    // container.removeEventListener("touchstart", ontouchstart, false)
    let touchPointOne, touchPointTwo
    touchPointOne = event.targetTouches[0]
    touchPointTwo = event.targetTouches[1]
    lastLengthScale = new THREE.Vector3(touchPointOne.clientX, touchPointOne.clientY, 0)
      .distanceTo(new THREE.Vector3(touchPointTwo.clientX, touchPointOne.clientY, 0))
    //限制缩放
    let objPaperTexturePoint = new THREE.Box3().setFromObject(objPaperTextureList[1])
    let gltfDeskFramePoint = new THREE.Box3().setFromObject(gltfDeskFrame)
    let scale = ((objPaperTextureList[1].scale.x
      * (gltfDeskFramePoint.max.x - gltfDeskFramePoint.min.x) / (objPaperTexturePoint.max.x - objPaperTexturePoint.min.x)).toFixed(2))
    let touchmove = (event) => {
      touchPointOne = event.targetTouches[0]
      touchPointTwo = event.targetTouches[1]
      let length = new THREE.Vector3(touchPointOne.clientX, touchPointOne.clientY, 0)
        .distanceTo(new THREE.Vector3(touchPointTwo.clientX, touchPointOne.clientY, 0))
      let animateTouchMoveScaleFunction = (lastLength) => {
        let ratio = (length / lastLength).toFixed(2)
        if ((objPaperTextureList[1].scale.x + (ratio - 1) / 5) < scale) {
          objPaperTextureList[1].scale.x += (ratio - 1) / 5
          objPaperTextureList[1].scale.y += (ratio - 1) / 5
          lastLengthScale = length
        }
        delete animateFunctionJson["animateTouchMoveScaleFunction"]
      }
      animateFunctionJson["animateTouchMoveScaleFunction"] = animateTouchMoveScaleFunction
    }
    container.addEventListener("touchmove", touchmove, false)
    container.addEventListener("touchend", () => {
      // dControls.enabled = true;
      container.removeEventListener("touchmove", touchmove, false)
      // container.addEventListener("touchstart", ontouchstart, false)
    })
  }
}

// function initDragControls(controls) {
//     // 添加平移控件
//     var transformControls = new TransformControls(camera, renderer.domElement);
//     scene.add(transformControls);
//
//     // 初始化拖拽控件
//     dragControls = new DragControls(objPaperTextureList, camera, renderer.domElement);
//     // 鼠标略过事件
//     dragControls.addEventListener('hoveron', function (event) {
//         // 让变换控件对象和选中的对象绑定
//         transformControls.attach(event.object);
//         transformControls.setSize(1);
//         // transformControls.setMode('scale');
//         transformControls.showY = false;
//     });
//     // 开始拖拽
//     dragControls.addEventListener('dragstart', function (event) {
//         controls.enabled = false;
//     });
//     // 拖拽结束
//     dragControls.addEventListener('dragend', function (event) {
//         controls.enabled = true;
//     });
// }

function initObj() {
  // camera.position.set(70,12,48.5);
  // controls.target.set(71,0,48.5);

  let spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(70,5,48.5)
  spotLight.castShadow = false
  spotLight.distance = 10
  let targetObject = new THREE.Object3D(70,0,48.5);
  scene.add(targetObject);
  scene.add(spotLight)
  spotLight.target = targetObject;
  //桌子
  createModel({
    //gltf,url,name,scene,function
    gltf: true,
    url: model.desk,
    name: "gltfDesk",
    function(gltf) {
      gltf.scale.set(6, 6, 6)
      gltfDesk = changeObjectToCenter(gltf, false)
      //28,0,-38
      gltfDesk.position.set(70,3,48.5)
      scene.add(gltfDesk)
    }
  })
  //桌子上的框
  createModel({
    gltf: true,
    url: model.frame,
    name: "gltfDeskFrame",
    function(gltf) {
      gltf.scale.set(5, 5, 5)
      gltfDeskFrame = changeObjectToCenter(gltf, false)
      gltfDeskFrame.position.set(70,8,48.5)//28, 5, -38
      gltfDeskFrame.rotateY(Math.PI / 2)
      scene.add(gltfDeskFrame)

    }
  })
  //桌子上的框里的纸
  objDeskFramePaper = createModel({
    //gltf,geometry,material,textureLoaderUrl,name,scene,function
    gltf: false,
    geometry: new THREE.BoxBufferGeometry(3, 6, 0),
    material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
    textureLoaderUrl: image.paper,
    name: "objDeskFramePaper",
    function(obj) {
      obj.position.set(70,7.3,48.5)//28, 4.3, -38
      obj.scale.set(1, 1, 1)
      obj.rotation.set(Math.PI / 2, 0, 0)
      scene.add(obj)
      selectedObjectsFlower[0] = obj
    }
  })

  //厚德载物
  //墙上的框
  // createModel({
  //   gltf: true,
  //   url: model.frame,
  //   name: "gltfWallFrame",
  //   function(gltf) {
  //     gltf.scale.set(15, 15, 15)
  //     gltfDeskFrame = changeObjectToCenter(gltf, false)
  //     gltfDeskFrame.position.set(20, 7.5, -64.5)
  //     gltfDeskFrame.rotateX(Math.PI / 2)
  //     scene.add(gltfDeskFrame)
  //
  //   }
  // })
  //墙上的纸
  // let objWallFramePaper = createModel({
  //   //gltf,geometry,material,textureLoaderUrl,name,scene,function
  //   gltf: false,
  //   geometry: new THREE.BoxBufferGeometry(6, 3, 0),
  //   material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
  //   textureLoaderUrl: image.paper,
  //   name: "objWallFramePaper",
  //   function(obj) {
  //     obj.position.set(20, 7.5, -66.8)
  //     obj.scale.set(2.95, 2.95, 2.95)
  //     obj.rotation.set(0, 0, 0)
  //     scene.add(obj)
  //   }
  // })
  //默认的厚德载物，因此不使⽤api。
  // createModel({
  //   gltf: false,
  //   geometry: new THREE.BoxBufferGeometry(6, 3, 0),
  //   material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
  //   textureLoaderUrl: changeURL("https://misitetong.top/media/flower/4f09761f4a9141dca7a12acc685d28e8.jpg"),
  //   // textureLoaderUrl: image.title2,
  //   name: "objWallFrameTexture_wallGroup0_1",
  //   function(obj) {
  //     obj.position.set(objWallFramePaper.position.x, objWallFramePaper.position.y, objWallFramePaper.position.z + 0.1)
  //     obj.scale.set(objWallFramePaper.scale.x, objWallFramePaper.scale.y, objWallFramePaper.scale.z)
  //     scene.add(obj)
  //   }
  // })
  // createModel({
  //   gltf: false,
  //   geometry: new THREE.BoxBufferGeometry(6, 3, 0),
  //   material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
  //   textureLoaderUrl: changeURL("https://misitetong.top/media/character/a43d5ca3b4c940c986dc9bbe6bcb30b5.png"),
  //   // textureLoaderUrl: image.title1,
  //   name: "objWallFrameTexture_wallGroup0_2",
  //   function(obj) {
  //
  //     obj.position.set(objWallFramePaper.position.x, objWallFramePaper.position.y, objWallFramePaper.position.z + 0.2)
  //
  //     obj.scale.set(objWallFramePaper.scale.x, objWallFramePaper.scale.y, objWallFramePaper.scale.z)
  //     scene.add(obj)
  //   }
  // })
  for (let i = 0; i < wallPosition.length; i++) {
    let gltfTemp
    let group = new THREE.Group()
    //墙上的框
    createModel({
      gltf: true,
      url: model.frame,
      name: "gltfWallFrame_" + i,
      function(gltf) {
        gltf.scale.set(5, 5, 5)
        gltfTemp = changeObjectToCenter(gltf, true)
        gltfTemp.position.set(wallPosition[i].x, wallPosition[i].y, wallPosition[i].z)
        // gltfTemp.rotation.set(Math.PI / 2, 0, Math.PI / 2)
        gltfTemp.rotation.set(Math.PI / 2, 0, 0)
        group.add(gltfTemp)
        gltfWallFrameList.push(gltfTemp)
      }
    })
    //墙上的纸
    objWallFramePaperList.push(createModel({
      //gltf,geometry,material,textureLoaderUrl,name,scene,function
      gltf: false,
      geometry: new THREE.BoxBufferGeometry(6, 3, 0),
      material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
      textureLoaderUrl: image.paper,
      name: "objWallFramePaper_" + i,
      function(obj) {
        obj.position.set(wallPosition[i].x, wallPosition[i].y, wallPosition[i].z)
        obj.scale.set(0.95, 0.95, 0.95)
        // obj.rotation.set(0, Math.PI / 2, 0)
        obj.rotation.set(0,0,0)
        group.add(obj)
      }
    }))
    scene.add(group)
    wallGroup.push(group)
  }


  //提示的球
  // objDeskFrameBall = createModel({
  //     gltf: false,
  //     geometry: new THREE.PlaneGeometry(32, 32, 32, 32),
  //     material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0.8, transparent: true}),
  //     textureLoaderUrl: "/media/123.jpg",
  //     name: "objDeskFrameBall",
  //     function(obj) {
  //         obj.position.set(28, 5.6, -38)
  //         obj.scale.set(0.5, 0.5, 0.5)
  //         scene.add(obj)
  //     }
  // })
  // createModel({
  //     gltf: false,
  //     geometry: new THREE.BoxBufferGeometry(1, 1, 0),
  //     material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
  //     textureLoaderUrl: image.paper1,
  //     name: 'objPaperTexture',
  //     function: (mesh) => {
  //         mesh.position.set(28, 4.35, -38)
  //         mesh.scale.set(1, 1, 1)
  //         mesh.rotation.set(Math.PI / 2, 0, 0)
  //         scene.add(mesh)
  //         objPaperTextureList.push(mesh)
  //     }
  // })
  //图片初始化缩放处理
  // setPaper = new THREE.Box3().setFromObject(objPaperTextureList[0])
  // setDeskFramePaper = new THREE.Box3().setFromObject(objDeskFramePaper)
  // // console.log(setDeskFramePaper, setPaper)
  // let dx = setDeskFramePaper.max.x - setDeskFramePaper.min.x
  // let dz = setDeskFramePaper.max.z - setDeskFramePaper.min.z
  // let px = setPaper.max.x - setPaper.min.x
  // let pz = setPaper.max.z - setPaper.min.z
  // // console.log(dx, dz, px, pz)
  // if (px - dx > pz - dz) {
  //     objPaperTextureList[0].scale.x = dx / px
  //     objPaperTextureList[0].scale.y = dx / px
  //     objPaperTextureList[0].scale.z = dx / px
  // } else {
  //     objPaperTextureList[0].scale.x = dz / pz
  //     objPaperTextureList[0].scale.y = dz / pz
  //     objPaperTextureList[0].scale.z = dz / pz
  // }
  // container.addEventListener('touchstart', touchstartEvent, false)
  //

}

// $api.getExhibitions({}).then(res => {
//     console.log(res)
//     // debugger
//     if (res["code"] == "00000") {
//         // console.log(res.data)
//         let num = 0
//         for (let i in res.data) {
//             createFrameAll(wallPosition[num], res.data[i], "wallGroup" + num)
//             num++
//         }
//         // for (let i = 0; i < res.data.length; i++) {
//         //     createFrameAll(wallPosition[i], res.data[i], "wallGroup" + i)
//         // }
//         console.log(scene)
//     } else {
//         console.log(res["msg"])
//     }
// }).catch(res => {
// })
export let changeFrameAll = (data) => {
  if (frameGroup.length !== 0) {
    for (let i in frameGroup) {
      scene.remove(frameGroup[i])
      frameGroup[i].traverse((e)=>{
        if(e instanceof THREE.Mesh){
          e.geometry.dispose();
          e.material.dispose();
        }
      });
    }
  }
  frameGroup = []
  let num = 0
  for (let i in data) {
    createFrameAll(wallPosition[num], data[i], "wallGroup" + num)
    num++
  }
}

function createFrameAll(positionVector3, array, groupName) {
  let group = new THREE.Group()
  group.name = groupName
  for (let i = 0; i < array.length; i++) {
    let str = array[i].coordinate
    let x = parseFloat(str.substring(str.indexOf("(") + 1, str.indexOf(","))).toFixed(3)
    let y = parseFloat(str.substring(str.indexOf(",") + 1, str.indexOf(")"))).toFixed(3)
    if (array[i]["index"] === 1) {
      // let str = array[i].coordinate;
      // let x = parseFloat(str.substring(str.indexOf("(")+1,str.indexOf(","))).toFixed(3);
      // let y = parseFloat(str.substring(str.indexOf(",")+1,str.indexOf(")"))).toFixed(3);
      group.add(createModel({
        gltf: false,
        geometry: new THREE.BoxBufferGeometry(1, 1, 0),
        material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, transparent: true}),
        textureLoaderUrl: changeURL(array[i]["url"]),
        name: "objWallFrameTexture_" + groupName + "_" + array[i]["index"],
        function(obj) {
          // obj.position.set(
          //   parseFloat(positionVector3.x) - 0.1,
          //   parseFloat(positionVector3.y) - parseFloat(x),
          //   parseFloat(positionVector3.z) - parseFloat(y))
          obj.position.set(
              parseFloat(positionVector3.x) - parseFloat(y),
              parseFloat(positionVector3.y) - parseFloat(x),
              positionVector3.z + 0.05,
          )
          // obj.rotation.set(0, Math.PI / 2, 0)
          obj.rotation.set(0,0,0)
          obj.scale.set((array[i].scale) - 0.1, (array[i].scale) - 0.1, (array[i].scale) - 0.1)
        }
      }))
    } else if (array[i]["index"] === 2) {
      let texture = THREE.ImageUtils.loadTexture(changeURL(array[i]["url"]), {}, function () {
        renderer.render(scene, camera)
      })
      // 材质
      let material = new THREE.MeshLambertMaterial({
        map: texture,
        color: 0xffff00,
        transparent: true,
        // depthWrite: false,
        depthTest: false,
      })
      material.side = THREE.DoubleSide
      material.transparent = true
      // ⼏何体
      let cube = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 32), material)
      // cube.position.set(
      //   positionVector3.x - 0.5,
      //   parseFloat(positionVector3.y) - parseFloat(x),
      //   parseFloat(positionVector3.z) - parseFloat(y))
      cube.position.set(
          parseFloat(positionVector3.x) - parseFloat(y),
          parseFloat(positionVector3.y) - parseFloat(x),
          positionVector3.z + 0.1,
      )
      // cube.rotation.set(0, -Math.PI / 2, 0)
      cube.rotation.set(0,0,0)
      cube.scale.set((array[i].scale) - 0.1, (array[i].scale) - 0.1, (array[i].scale) - 0.1)
      cube.name = "objWallFrameTexture_" + groupName + "_" + array[i]["index"]
      group.add(cube)
    }
  }
  frameGroup.push(group)
  scene.add(frameGroup[frameGroup.length - 1])
  return group
}


function searchWhite(canvas1) {
  let canvas = canvas1
  let ctx = canvas.getContext('2d')
  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let lOffset = canvas.width, rOffset = 0, tOffset = canvas.height, bOffset = 0
  // console.log(canvas.width, canvas.height)
  for (let i = 0; i < canvas.width; i++) {
    for (let j = 0; j < canvas.height; j++) {
      let pos = (i + canvas.width * j) * 4
      if (imgData[pos] === 255 || imgData[pos + 1] === 255 || imgData[pos + 2] === 255 || imgData[pos + 3] === 255) {
        // 说第j行第i列的像素不是透明的
        // 楼主貌似底图是有背景色的,所以具体判断RGBA的值可以根据是否等于背景色的值来判断
        bOffset = Math.max(j, bOffset) // 找到有色彩的最底部的纵坐标
        rOffset = Math.max(i, rOffset) // 找到有色彩的最右端
        tOffset = Math.min(j, tOffset) // 找到有色彩的最上端
        lOffset = Math.min(i, lOffset) // 找到有色彩的最左端
      }
    }
  }
// 由于循环是从0开始的,而我们认为的行列是从1开始的
  lOffset++
  rOffset++
  tOffset++
  bOffset++
  // console.log(lOffset, rOffset, tOffset, bOffset) // 1 100 26 50
  return [lOffset, rOffset, tOffset, bOffset]
// 意思是说包含有像素的区域是 左边第1行,到右边第100行,顶部第26行,到底部50行
// 此时如果你想找到外部区域的话,就是 left和top减1  right和bottom加1的区域
// 分别是0, 101, 25, 51.这个区间能够刚好包裹住
}