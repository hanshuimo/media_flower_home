import axios from 'axios'

export let baseUrl = "https://misitetong.top/api"


let instance = axios.create({
    headers: {
        // 'content-type': "application/x-www-form-urlencoded",
        // 'Access-Control-Allow-Origin': '*'
    },
    baseURL: baseUrl,
    crossDomain: true,
    withCredentials: false,//不允许携带cookie
    // proxy: {
    //     host: "https://192.168.3.80",
    //     port: 8080
    // },
})

// http request 拦截器
instance.interceptors.request.use(
    config => {
        const token = sessionStorage.getItem('token')
        // debugger
        if (token) { // 判断是否存在token，如果存在的话，则每个http header都加上token
            config.headers.token = token  //请求头加上token
        }
        return config
    },
    err => {
        return Promise.reject(err)
    }
)
// http response 拦截器
instance.interceptors.response.use(
    response => {
        //拦截响应，做统一处理
        // if (response.data.code) {
        //   switch (response.data.code) {
        //     case "00000":
        //       store.state.isLogin = false
        //       router.replace({
        //         path: 'login',
        //         query: {
        //           redirect: router.currentRoute.fullPath
        //         }
        //       })
        //   }
        // }
        return response
    },
    //接口错误状态处理，也就是说无响应时的处理
    error => {
        // if (error == 'Error: timeout of 600000ms exceeded') {
        //     // Message.error("请求超时,请稍后重试")
        // } else if (error == 'Error: Network Error') {
        //     // Message.error("网络错误，请稍后重试")
        // }
        // if (error && error.response) {
        //     if (error.response.status == '400') {
        //         // Message.error(`请求错误: ${error.response.data.error}`)
        //     } else if (error.response.status == '404') {
        //         // Message.error(`404请求地址错误: ${error.response.config.url}`)
        //     } else if (error.response.status == '500') {
        //         // Message.error(`服务器错误,请稍后重试！`)
        //     } else {
        //         // Message.error(`${error.response.data.error},${error.response.data.status}!`)
        //     }
        // }
        // return Promise.reject(error)
    }
)


//post的json数据上传
export let postJsonMethods = function (url, params) {
    return new Promise((resolve, reject) => {
        let config = {
            headers: {
                'Content-Type': 'application/json'
            }
        }
        instance.post(url, JSON.stringify(params), config).then(response => {
            resolve(response.data)
        }).catch(error => {
            reject(error)
        })
    })
}

//post提交
export let postMethods = function (url, params) {
    return new Promise((resolve, reject) => {
        instance.post(url, params).then(response => {
            resolve(response.data)
        }).catch(error => {
            reject(error)
        })
    })
}

// get提交
export let getMethods = function (url, params) {
    return new Promise((resolve, reject) => {
        instance.get(url, {params: params}).then(response => {
            resolve(response.data)
        }).catch(error => {
            reject(error)
        })
    })
}

// formdata表单上传
export let formDataMethods = function (url, params) {
    return new Promise((resolve, reject) => {
        let formData = new FormData()
        for (var i in params) {
            formData.append(i, params[i])
        }
        let config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
        }
        instance.post(url, formData, config).then(response => {
            resolve(response.data)
        }).catch(error => {
            reject(error)
        })
    })
}


