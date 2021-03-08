import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js"

export class CustomDB {
    constructor(dbInfo, storeInfo) {
        this.dbInfo = dbInfo
        this.request = null
        this.db = null
        // this.delete()
        this.request = window.indexedDB.open(this.dbInfo.dbName, this.dbInfo.version)
        this.request.onerror = (e) => {
            console.log('数据库打开报错')
        }
        this.request.onsuccess = (e) => {
            console.log('数据库打开成功')
        }
        this.request.onupgradeneeded = (e) => {
            this.db = e.target.result
            for (let i in storeInfo) {
                if (!this.db.objectStoreNames.contains(storeInfo[i].baseInfo.storeName)) {
                    let objectStore = this.db.createObjectStore(storeInfo[i].baseInfo.storeName, {
                        keyPath: storeInfo[i].baseInfo.keyPath,
                        autoIncrement: storeInfo[i].baseInfo.storeIfUp
                    })
                    // for (let j in storeInfo[i].indexesInfo) {
                    //   objectStore.createIndex(j, j, {unique: storeInfo[i].indexesInfo[i]})
                    // }
                    console.log('数据库初始化成功')
                } else {
                    console.log('数据库重复')
                }
            }
        }
    }

    /*
    warning：this method should be called before dateBase init
     */
    add(params) {
        console.log(this.db)
        let request = this.db.transaction(this.db.objectStoreNames[0], 'readwrite').objectStore(this.db.objectStoreNames[0]).add(params)
        request.onsuccess = () => {
            console.log('数据添加成功')
        }
        request.onerror = () => {
            console.log('数据添加失败')
        }
    }

    delete() {
        if (this.dbInfo) {
            window.indexedDB.deleteDatabase(this.dbInfo.dbName).onsuccess = () => {
                console.log('数据库删除成功，重新初始化...')
            }
        }
    }

    get(objectStoreNames, id, group) {
        let request = this.db.transaction([objectStoreNames]).objectStore(objectStoreNames).get(id)
        request.onerror = (e) => {
            console.log('读取失败')
        }
        request.onsuccess = (e) => {
            if (request.result) {
                new GLTFLoader().parse(request.result.gltfInfo, "", (gltf) => {
                    group.add(gltf.scene)
                })
            }
        }
    }
}