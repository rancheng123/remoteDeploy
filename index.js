var fs= require('fs');
var nodeJsZip = require("nodeJs-zip");
var Ssh = require('ssh2');
var Client = require('svn-spawn');
var childProcess = require('child_process');

function Employ(){

};
Employ.prototype = {
    constructor: Employ,
    svnUpdate: function (opts) {

        console.log('拉取svn代码 开始')
        var that = this;

        var svnClient = new Client({
            //表示在这个目录下进行 svn操作
            cwd: opts.cwd,
            username: opts.username, // optional if authentication not required or is already saved
            password: opts.password, // optional if authentication not required or is already saved
            noAuthCache: true, // optional, if true, username does not become the logged in user on the machine
        });

        var isExist = that.fsExistsSync(opts.cwd);
        //不目录存在，创建目录并且checkout
        if(!isExist){

            fs.mkdir(opts.cwd,function(error){
                console.log(error)

                svnClient.cmd(['checkout',opts.repository,opts.cwd,'--username',opts.username],function(err, data) {
                    console.log(err)

                    if(err){
                        console.log('checkout 失败');
                    }else{
                        console.log('checkout 成功');

                        console.log('拉取svn代码 结束')
                        opts.success && opts.success()
                    }
                });
            })


        }
        //目录存在，直接跟新
        else{
            svnClient.update(function(err, data) {
                if(err){
                    console.log('update 失败');
                }else{
                    console.log('update 成功');

                    console.log('拉取svn代码 结束')
                    opts.success && opts.success()
                }
            });
        }


    },
    compile: function (opts) {


        console.log('npm install  start')
        //install
        childProcess.exec('cnpm install',{
            //子进程的当前工作目录
            cwd: opts.cwd
        },function(error,stdout,stderr){
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);

            console.log('npm install  end')


            console.log('webpack build  start')
            //build
            var workerProcess = childProcess.exec(opts.command,{
                //子进程的当前工作目录
                cwd: opts.cwd
            });
            workerProcess.stdout.on('data', function (data) {
                console.log('stdout: ' + data);
            });

            workerProcess.stderr.on('data', function (data) {
                console.log('stderr: ' + data);
            });
            workerProcess.on('close',function(){


                console.log('webpack build  end')
                opts.success()
            })

        })



    },
    remoteTransfer: function (opts) {

        var sshClient = new Ssh();
        sshClient.on('ready', function() {
            console.log('Connection :: ready');


            //sftp(Secure File Transfer Protocol的缩写，安全文件传送协议)
            sshClient.sftp(function(err, sftp) {

                if (err) throw err;
                sftp.on('end', function() {
                    console.log('SFTP :: SFTP session closed');
                });
                //上传本地到远程
                sftp.fastPut(opts.localFilePath, opts.remoteFilePath, function (Error) {
                    if (!Error) {
                        sftp.end();
                        console.log('远程传输成功')


                        console.log('远程解压 开始')
                        //删除目录
                        sshClient.exec('rm -rf '+ opts.unzipDir,function(err,stream){

                            //解压缩
                            sshClient.exec('unzip '+ opts.remoteFilePath +' -d '+ opts.unzipDir,function(err,stream){

                                if (err) throw err;
                                stream.on('close', function(code, signal) {
                                    sshClient.end();
                                    console.log('远程解压 完成')

                                }).on('data', function(data) {
                                    console.log('STDOUT: ' + data);
                                })
                            })
                        })
                    }
                });

            });

        });
        sshClient.on('error', function(err) {
            console.log('Connection :: error :: ' + err);
        });
        sshClient.on('end', function() {
            console.log('Connection :: end');
        });
        sshClient.on('close', function(had_error) {
            console.log('Connection :: close');

            opts.success()
        });
        sshClient.connect(opts.sshOpts);


    },
    //检测文件或者文件夹存在 nodeJS
    fsExistsSync: function(path){
        try{
            fs.accessSync(path,fs.F_OK);
        }catch(e){
            return false;
        }
        return true;
    },
    init: function () {
        var that = this;
        //拉取svn代码
        that.svnUpdate({
            //本地svn工作目录
            cwd: 'H:/test/sop-remote/qianjia',
            username: 'rancheng',
            password: 'rancheng',
            //远程库地址
            repository: 'https://192.168.0.70/svn/前端设计/Qianjia',
            success: function () {


                //打包编译
                that.compile({
                    //本地工作目录
                    cwd: 'H:/test/sop-remote/qianjia',
                    command: 'cd build & set NODE_ENV=production  & set APP_ENV=qianjia &node build.js & node buildStatic.js',
                    success: function () {


                        //压缩
                        nodeJsZip.zip(/*被压缩目录*/'H:/test/sop-remote/qianjia/frontEnd/qianjia/dist',{
                            //指定压缩文件的路径
                            dir: 'H:/test/sop-remote/qianjia/frontEnd/qianjia/',
                            //指定压缩文件的名称
                            name: 'dist'
                        })



                        //远程传输
                        that.remoteTransfer({
                            //ssh服务器配置
                            sshOpts: {
                                "host": "192.168.0.215",
                                "port": 20015,
                                "username": "rancheng",
                                "password": "rancheng123!!",
                            },

                            //被传输的本地文件
                            localFilePath: 'H:/test/sop-remote/qianjia/frontEnd/qianjia/dist.zip',
                            //生成的远程文件
                            remoteFilePath: '/home/rancheng/London/dist.zip',
                            //远程文件生成后，被解压的目录
                            unzipDir: '/home/rancheng/London/dist',
                            success: function () {


                            }
                        });
                    }
                });
            }
        })


    }
};
var employCase = new Employ();
employCase.init();




/*
//检测svn库
svnClient.getInfo(function(err, data) {
    console.log('Repository url is %s', data.url);
});*/
