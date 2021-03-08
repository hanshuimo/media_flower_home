const {resolve} = require('path')//处理绝对路径
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
//设置node.js环境变量，决定browersList使用什么环境
process.env.NODE_ENV = 'development'
const devCssLoader = [
    'style-loader',
    'css-loader',
    {
        loader: 'postcss-loader'
    }
]
const prodCssLoader = [
    MiniCssExtractPlugin.loader,
    'css-loader',
    {
        loader: 'postcss-loader'
    }
]
module.exports = {
    //可以有多个⼊⼝
    entry: {
        index: './src/js/index.js',
    },
    // entry:['./src/galleryBridge/js/index.js'],
    output: {
        filename: 'js/built.js',
        //所有file-loader加载的资源都会根据output.path进⾏路径修改
        path: resolve(__dirname, 'build'),//__dirname是nodejs的变量，代表当前⽬录的绝对路径
        //引⽤的路径是publicPath + 图⽚相对于output.path的路径
        publicPath: ''
    },
    //loader的配置
    module: {
        rules: [
            //详细的loader配置
            {
                //匹配哪些⽂件,正则表达式
                test: /\.css$/,
                //使⽤哪些loader,use数组中loader执⾏顺序：从右到左，从下到上
                use: [
                    //展开数组
                    ...devCssLoader
                ]
            },
            // {
            // test:/\.less$/,
            // use:[
            // ...prodCssLoader,
            // 'less-loader'//下载less,lessloader
            // ]
            // },
            {
                //默认处理html中的img图片,ES6模块
                test: /\.(jpg|png|gif)$/,
                //当use只有一个loader时可以直接写loader
                loader: 'url-loader',//下载url-loader,file-loader
                options: {
                    limit: 0,
                    //因为url-loader和html-loader模块方式不一样
                    //解决：关闭url-loader,使用commonjs解析
                    esModule: false,
                    //取图片的hash前十位和文件原来的扩展名
                    name: '[name].[ext]',
                    outputPath: 'images'
                }
            }, {
                //处理html文件中的img图片,commonjs模块，从而能被url-loader进行处理
                test: /\.html$/,
                loader: 'html-loader'
            }, {
                //打包其他资源
                exclude: /\.(css|js|html|less|png|jpg|gif)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: 'other'
                }
            }
            // ,{
            // //语法检查eslint-loader eslint,只检查⾃⼰写的源代码，不检查第三⽅库
            // //设置规则在package.json中的eslintConfig中设置，推荐规则：airbnb
            // //airbnb需要插件eslint eslint-plugin-import eslint-config-airbnb-base
            // //eslint-disable-next-line可以使得下⼀⾏不进⾏eslint检查，可选择使⽤(直接注释在上⼀⾏)
            // test:/\.js$/,
            // enforce:'pre',//语法检查要在兼容之后
            // exclude:/node_modules/,
            // loader:'eslint-loader',
            // options:{
            // //⾃动修复eslint错误
            // fix:true
            // }
            // }
            , {
                //js兼容性处理,需要的插件：@babel/core babel-loader
                //1. 基本处理：@babel/preset-env 只能转换基本语法，不能转换promise之类的
                //2. 全部的js兼容：@babel/polyfill。使⽤：在js中引⼊即可：import '@babel/polyfill'。缺点：体积太⼤
//3. 需要做兼容性处理就做，按需加载：core-js
//@babel/plugin-transform-runtime @babel/runtime
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                options: {
                    //预设：只是babel做怎么样的兼容性处理
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                //按需加载
                                useBuiltIns: 'usage',
                                corejs: {
                                    version: 3
                                },
                                //指定兼容性做到哪个版本浏览器
                                targets: {
                                    chrome: '60',
                                    firefox: '60',
                                    ie: '9',
                                    safari: '10',
                                    edge: '17'
                                }
                            }
                        ]
                    ]
                }
            },
            {
                test: /\.worker\.js$/, //以.worker.js结尾的文件将被worker-loader加载
                loader: 'worker-loader',
                // options: {
                //     // inline: true
                //     // publicPath: '/other/'
                // }
            }
        ]
    },
// //plugin的配置
    plugins: [
        //默认创建空的html⽂件，引⼊打包输出的所有资源（js,css）
        new HtmlWebpackPlugin({
            //当带参数时，会复制该⽂件然后再引⼊
            template: './src/index.html',
            //压缩html
            // minify:{
            // //移除空格
            // collapseWhitespace:true,
            // //移除注释
            // removeComments:true
            // }
        }),
        new MiniCssExtractPlugin({
            filename: 'css/built.css'
        }),
        new OptimizeCssAssetsWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns:[
                {from : resolve(__dirname,'./model/'), to : resolve(__dirname,'./build/other/')}
                // {from : resolve(__dirname,'./src/lib'), to : resolve(__dirname,'./build/lib')}
            ]
        })
    ],
    //模式
    mode: 'development',
    // mode:'production',//⽣产环境⾃动压缩js压缩
    //开发服务器 devServer：⽤来⾃动化（⾃动编译，⾃动打开浏览器，⾃动刷新浏览器）
    //只会在内存中编译打包，不会有任何输出到本地代码
    //启动devServer指令是：npx webpack-dev-server
    devServer: {
        proxy: {
            "/media": {
                target: "https://misitetong.top",
                changeOrigin: true,//接口跨域
                secure: false  //设置支持https协议代理
                // pathRewrite:{
                //  重写地址
                // }
            }
        },
        //项⽬构建后的路径
        contentBase: resolve(__dirname, 'build'),
        //启动gzip压缩
        compress: true,
        port: 3000,
        host: '0.0.0.0',
        https: true,
        //⾃动打开浏览器
        open: true,
        //HMR:hot module replacement：热模块替换，提升构建速度.
        //样式⽂件：HMR被style-loader内部实现，因此开发环境推荐⽤style-loader,⽽不是MiniCssExtractPlugin.loader
        //js⽂件：默认不使⽤HMR功能。
        // 需要在js中添加代码：（不能对⼊⼝⽂件使⽤-没意义）
        // if(module.hot){
        // module.hot.accept('./print.js',function(){
        // //⽅法会监听printjs⽂件的变化，⼀旦发⽣变化，其他模块不会重新打包构建。会执⾏后⾯的回调函数
        // //print();
        // })
        // }
        //html⽂件：默认不使⽤HMR功能，同时会导致问题：HTML⽂件不能热更新，（不做HMR功能）
        // 解决：修改entry⼊⼝，将html引⼊：entry:['./src/js/index.js','./src/index.html']
        //开启hmr
        // hot:true
    },
    devtool: 'source-map'
}