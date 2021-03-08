import * as THREE from 'three/build/three.module.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'

self.addEventListener('message', (e) => {
    let data = e.data
    let request = indexedDB.open('model', 1)
    request.onsuccess = (e) => {
        let db = request.result
        // console.log(data)
        // console.log(db)
        let search = db.transaction([data.storeName]).objectStore(data.storeName).get(data.id)
        search.onerror = (e) => {
        }
        search.onsuccess = (e) => {
            if (search.result) {
                // console.log('数据库有模型')
                let params = {
                    modelGroups: search.result.id,
                    arrayBuffer: search.result.arrayBuffer
                }
                self.postMessage(params)
                self.close()
            } else {
                // console.log('数据库没模型')
                initGltfD(data)
            }
        }
    }
})

function add(arrayBuffer, gltfName, storeName, onsuccess) {
    let request = indexedDB.open('model', 1)
    request.onsuccess = (e) => {
        let db = request.result
        let addInfo = db.transaction([storeName], 'readwrite').objectStore(storeName).add({
            'id': gltfName,
            'arrayBuffer': arrayBuffer
        })
        addInfo.onsuccess = (e) => {
            /*
            todo
            warning:
            定时器问题，定时器删除数据库不能正确添加数据
             */
            setTimeout(() => {
                onsuccess()
            }, 1000)
        }
        addInfo.onerror = (e) => {
        }
    }
}

function initGltfD(gltfInfo) {
    /*
    to solve path problem from gltfLoader js/other => js/../other
     */
    gltfInfo.url = "../" + gltfInfo.url
    // console.log(gltfInfo)
    new GLTFLoader().load(gltfInfo.url, (e) => {
    }, (e) => {
        // console.log(e)
        if (e.currentTarget.response) {
            // console.log(e.currentTarget.response)
            let data = e.currentTarget.response
            let params = {
                modelGroups: gltfInfo.storeName,
                arrayBuffer: data
            }
            // self.close()
            add(data, gltfInfo.id, gltfInfo.storeName, () => {
                // self.postMessage(params)
                self.postMessage(params)
                self.close()
            })
        }
        // if (e.loaded === e.total) {
        //     console.log(e.target.response)
        //     let data = e.target.response
        //     add(data, gltfInfo.id, gltfInfo.storeName, () => {
        //         let params = {
        //             modelGroups: gltfInfo.storeName,
        //             arrayBuffer: data
        //         }
        //         self.postMessage(params)
        //         self.close()
        //     })
        // }
    })
}
