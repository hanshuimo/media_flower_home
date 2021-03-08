import {postMethods, getMethods, formDataMethods, postJsonMethods, getAsset} from './axios'

export let $api = {
    hello: params => postMethods("/hello", params),
    uploadFlower: params => formDataMethods("/uploadFlower", params),
    uploadCharacter: params => formDataMethods("/uploadCharacter", params),
    savePositions: params => postJsonMethods('/savePosition', params),
    getExhibitions: params => getMethods('/getExhibitions', params),
    getSettings: params => getMethods('/getSettings', params),
    getTempUserId: params => getMethods('/getTempUserId', params),
}