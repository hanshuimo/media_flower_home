module.exports = {
    // flowerHomeTool:flowerHomeTool.all003.default,
    //水桶
    bigBucket:
    // require('../../model/blendergltfBigBucket.gltf').default,
        [
            {url: require('../../model/blendergltfBigBucket.gltf').default, id: 'bigBucket', storeName: 'bigBucket'}
        ],
    //棒子
    club: [{url: require('../../model/blendergltfClub.gltf').default, id: 'club', storeName: 'club'}],
    desk: [{url: require('../../model/blendergltfDesk.gltf').default, id: 'desk', storeName: 'desk'}],
    frame: [{url: require('../../model/blendergltfFrame.gltf').default, id: 'frame', storeName: 'frame'}],
    //水槽
    waterChannel: [{
        url: require('../../model/blendergltfWaterChannel.gltf').default,
        id: 'waterChannel',
        storeName: 'waterChannel'
    }],
    //桌子
    table: [{url: require('../../model/blendergltfTable.gltf').default, id: 'table', storeName: 'table'}],
    //筛子
    laoZhi: [{url: require('../../model/blendergltfLaoZhi.gltf').default, id: 'laoZhi', storeName: 'laoZhi'}],
    //刷子
    brush: [{url: require('../../model/blendergltfBrush.gltf').default, id: 'brush', storeName: 'brush'}],
    flowerHouse: require('../../model/flowerHome.gltf').default
}