import nsfwjsApi from 'nsfwjs-api';
// const nsfwjsApi=require('nsfwjs-api')

// 是否使用本地模型 默认false
nsfwjsApi.UseModel = true;

// 模型位置 默认运行文件夹下model, UseModel为false时无效
nsfwjsApi.model = './model/';

//   copy模型文件夹, UseModel为false时无效 
// 模型文件 https://github.com/infinitered/nsfwjs/tree/master/example/nsfw_demo/public/model
nsfwjsApi.cpModel();

// gif配置
nsfwjsApi.gif = {
  // fps: 1, //每秒帧数，从中按比例选取帧（默认为所有帧）
  topk: 5 // 每帧返回的结果数（默认全部为 5）
};

// 鉴图
//  图片地址 可以是 https | http | 图片路径
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
