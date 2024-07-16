import nsfwjsApi from 'nsfwjs-api';


// 是否使用本地模型 默认false
nsfwjsApi.UseModel = true;

// 模型位置 默认运行文件夹下model, UseModel为false时无效
nsfwjsApi.model = './model/';

//   copy模型文件夹, UseModel为false时无效 
// 模型文件 https://github.com/infinitered/nsfwjs/tree/master/models/inception_v3
nsfwjsApi.cpModel();

nsfwjsApi.topk=1

// 鉴图
//  图片地址 可以是 https | http | 图片路径 | Buffer
nsfwjsApi
  .identificationOfPictures('./QQ截图20221116221527.gif')
  .then(result => {
    // 成功
    if (result.code === 200) {
      console.log(result.msg);
    } else {
      // 失败
      console.log(result.msg);
    }
  })
  .catch(err => {
    console.log(err);
  });
