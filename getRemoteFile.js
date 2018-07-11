





debugger
var Ssh = require('ssh2');
var c = new Ssh();
c.on('ready', function() {
    console.log('Connection :: ready');



    function Remote(opts){
        this.opts = opts;
        this.localDirPath = this.opts.localDirPath;
        this.remoteDirPath = this.opts.remoteDirPath;

        var pathArr = this.remoteDirPath.split('/');
        this.remoteRearDirName = pathArr.pop();
        this.remoteVanDirName = pathArr.join('/')
        this.zipDirName = this.remoteRearDirName +'.tar.gz'

    }
    Remote.prototype = {
        downLoad: function (opts) {
            var that = this;
            that.zip();


        },
        zip: function () {
            var that = this;
            //压缩
            c.exec('tar czvf '+ that.remoteVanDirName +'/'+ that.zipDirName +' '+ that.remoteDirPath,function(err,stream){

                if (err) throw err;
                stream.on('close', function(code, signal) {
                    that.transfer();

                }).on('data', function(data) {
                    console.log('STDOUT: ' + data);
                })
            })
        },
        transfer: function () {
            var that = this;
            c.sftp(function(err, sftp) {
                //下载远程到本地（两个必须都是文件名，非目录）
                sftp.fastGet(that.remoteVanDirName +'/'+ that.zipDirName, that.localDirPath +'/'+ that.zipDirName, function (Error) {
                    if(Error){
                        console.log('远程文件下载失败')
                    }else{
                        console.log('远程文件'+ that.remoteRearDirName +'下载成功')
                    }
                });
            })
        }
    }

    var remoteCase = new Remote({
        localDirPath: 'H:/test/caisujia',
        remoteDirPath: '/home/nexus'
    });
    remoteCase.downLoad()





//employ()



});
c.on('error', function(err) {
    console.log('Connection :: error :: ' + err);
});
c.on('end', function() {
    console.log('Connection :: end');
});
c.on('close', function(had_error) {
    console.log('Connection :: close');
});
c.connect({
    "host": "192.168.0.215",
    "port": 20015,
    "username": "rancheng",
    "password": "rancheng123!!",
});









function exec(order,fn){
    //操作服务器（写linux 代码）
    c.exec(order,function(err,stream){

        if (err) throw err;

        fn && fn(stream);

        stream.on('close', function(code, signal) {
            // console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            c.end();
        }).on('data', function(data) {
            debugger
            console.log('STDOUT: ' + data);
        })
    })
}



function employ(){
    //sftp(Secure File Transfer Protocol的缩写，安全文件传送协议)
    c.sftp(function(err, sftp) {

        if (err) throw err;
        sftp.on('end', function() {
            debugger
            console.log('SFTP :: SFTP session closed');
        });


        var localFilePath = 'H:/test/caisujia/a.js';
        var remoteFilePath = '/home/rancheng/London/a.js';

        //上传本地到远程
        sftp.fastPut(localFilePath, remoteFilePath, function (Error) {

            if (!Error) {
                console.log('employ success');
                sftp.end();
                c.end();
            }
        });

    });
}



