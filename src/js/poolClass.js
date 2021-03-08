import * as THREE from 'three/build/three.module.js'
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js"
import Worker from './model.worker.js'

class CustomThreadTask {
    constructor(taskName, taskMessage, callFunction) {
        this.taskName = taskName
        this.taskMessage = taskMessage
        this.callFunction = callFunction
    }
}

function CustomThreadPool() {
}

CustomThreadPool.prototype.poolSize = navigator.hardwareConcurrency - 1 || 1
CustomThreadPool.prototype.activeTaskNum = 0
CustomThreadPool.prototype.activeTaskMap = {}
CustomThreadPool.prototype.blockTaskList = []
CustomThreadPool.prototype.constructor = (num) => {
    CustomThreadPool.prototype.poolSize = num
}
CustomThreadPool.prototype.addTask = (task) => {
    let scope = CustomThreadPool.prototype
    if (task instanceof CustomThreadTask) {
        if (scope.activeTaskNum < scope.poolSize) {
            scope.activeTaskMap[task.taskName] = task
            scope.activeTaskNum++
            scope.executeTask(task)
        } else {
            scope.blockTaskList.push(task)
        }
    }
}
CustomThreadPool.prototype.executeTask = (task) => {
    let scope = CustomThreadPool.prototype
    let worker = new Worker()
    worker.postMessage(task.taskMessage)
    worker.onmessage = (e) => {
        worker.terminate()
        scope.deleteTask(task)
        task.callFunction(e.data)
    }
}
CustomThreadPool.prototype.swithTask = () => {
    let scope = CustomThreadPool.prototype
    if (scope.blockTaskList.length > 0) {
        scope.addTask(scope.blockTaskList.shift())
    }
}
CustomThreadPool.prototype.deleteTask = (task) => {
    let scope = CustomThreadPool.prototype
    delete scope.activeTaskMap[task.taskName]
    scope.activeTaskNum--
    scope.swithTask()
}


export class CustomGLTFLoader {
    constructor(modelUrlList, modelName) {
        this.modelCompleteNum = 0
        this.modelUrlList = modelUrlList
        this.modelName = modelName
        this.modelList = []
        this.modelGroup = new THREE.Group()
        this.modelInfo = null
        // this.modelGroup.position.set(0, 0, 0)
    }

    async load() {
        for (let i = 0; i < this.modelUrlList.length; i++) {
            // debugger
            CustomThreadPool.prototype.addTask(new CustomThreadTask('i:' + this.modelName, this.modelUrlList[i],
                (data) => {
                    this.modelCompleteNum++
                    this.partLoad(data, this)
                }))
        }
        await this.complete(this)
        return this.modelGroup
    }

    async partLoad(data, scope) {
        await new Promise((resolve, reject) => {
            setTimeout(function () {
                scope.modelList.push(data)
                //获得worker传出的模型自动建组
                new GLTFLoader().parse(data.arrayBuffer, "", (gltf) => {
                    // scope.modelGroup.add(gltf.scene)
                    // scope.modelGroup.add(gltf.scene)
                    // if (gltf.scene.name === 'Scene') {
                    //     // console.log(gltf.scene)
                    //     if (gltf.scene.children[0].name == '柱体015') {
                    //         let a = new THREE.Group()
                    //         for (let i in gltf.scene.children) {
                    //             a.add(gltf.scene.children[0])
                    //         }
                    //         scope.modelGroup.add(a)
                    //         console.log(a)
                    //         scope.modelGroup.position.set(0, 0, 0)
                    //         let box = new THREE.Box3().expandByObject(a)
                    //         let x = (box.max.x + box.min.x) / 2
                    //         let z = (box.max.z + box.min.z) / 2
                    //         let y = (box.max.y + box.min.y) / 2
                    //         console.log(box)
                    //         // a.position.set(-x, -y, -z)
                    //     } else {
                    //         for (let i in gltf.scene.children) {
                    //             scope.modelGroup.add(gltf.scene.children[0])
                    //         }
                    //     }
                    // } else {
                    //     // console.log(gltf.scene)
                    //     scope.modelGroup.add(gltf.scene)
                    // }
                    scope.modelGroup.add(gltf.scene)
                })
                resolve('time')
            }, 500)
        })
    }

    async complete(scope) {
        await new Promise((resolve, reject) => {
            setInterval(() => {
                if (scope.modelList.length === scope.modelUrlList.length) {
                    resolve('complete over')
                }
            }, 200)
        }).then(res => {
            // console.log(res)
        })
    }
}