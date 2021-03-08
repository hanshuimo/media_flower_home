import {$api} from "./api"
import {changeSky, changeRain} from "../js"
import {changeFrameAll} from "../js/makeFlower"



let ws
let baseUrl = 'wss://misitetong.top/api/tempWebSocket/'

export function initWebSocket() {
  $api.getTempUserId().then(res => {
    // console.log(res)
    let url = baseUrl + res.data
    sessionStorage.setItem('token', res.data)

    //初始化天气
    $api.getSettings().then(res => {
      // console.log(res)
      changeSky(res.data['weather'])
      changeRain(res.data['rain'])
    })
    //初始化展示
    $api.getExhibitions().then(res => {
      // console.log(res.data)
      changeFrameAll(res.data)
    })

    ws = new WebSocket(url)
    ws.onopen = () => {
      console.log('websocket已连接')
    }
    ws.onmessage = (res) => {
       console.log('websocket正在连接')
      console.log(res)
      console.log(res.data)
      let info = res.data
      info = eval('(' + info + ')');
      console.log(info)
      let exhibitions = info.exhibitions
      let settings = info.settings
      if(settings){
        console.log(settings)
        changeSky( settings['weather'])
        changeRain( settings['rain'])
      }
      if(exhibitions){
        changeFrameAll(exhibitions)
      }
    }
    ws.onclose = () => {
      console.log('websocket已停止')
      initWebSocket()
    }
    // window.setInterval(()=>{
    //   let ping = {'type':'ping'}
    //   ws.send(JSON.stringify(ping))
    //   console.log(ping)
    // },1000)
    window.onbeforeunload = function () {
      ws.close()
    }
  })
}