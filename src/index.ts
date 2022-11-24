import { node } from '@tensorflow/tfjs-node';
import { load } from 'nsfwjs';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import FileType from 'file-type';

class nsfwjsApi {
  /**
   * @description:  模型位置 默认运行文件夹下model, UseModel为false时无效
   * @return {*}
   */
  model: string;
  /**
   * @description:  是否使用本地模型 默认false
   * @return {*}
   */
  UseModel: boolean;
  /**
   * @description:  gif配置
   * @param {object} gif
   * @param {number} gif.fps 每秒帧数，从中按比例选取帧（默认为所有帧）
   * @param {number} gif.topk 每帧返回的结果数（默认全部为 5）
   * @return {*}
   */
  gif: { fps?: number; topk?: number };

  constructor() {
    //模型位置
    this.model = path.resolve(process.cwd(), 'model');
    this.UseModel = false;
    this.gif = {
      fps: undefined,
      topk: 5
    };
  }

  /**
   * @description:  copy模型文件夹, UseModel为false时无效  模型文件 https://github.com/infinitered/nsfwjs/tree/master/example/nsfw_demo/public/model
   * @return {void}
   */
  cpModel(): void {
    // 不使用本地模型
    if (!this.UseModel) {
      return;
    }
    // 创建文件夹
    try {
      fs.mkdirSync(this.model, { recursive: true });
    } catch (error) {
      console.error(`创建文件夹${path.resolve(this.model)} 失败`);
      console.error(error);
      process.exit();
    }

    // 文件夹存在 并且 文件夹不是空的
    if (
      fs.existsSync(this.model) &&
      fs.readdirSync(this.model).toString() !== ''
    ) {
      return;
    }

    // 复制文件
    fs.cpSync(path.resolve(__dirname, '..', 'model'), this.model, {
      recursive: true
    });
  }

  /**
   * @description:  鉴图
   * @param {string} image 图片地址 可以是 https | http | 图片路径
   * @return {*}
   */
  async identificationOfPictures(image: string) {
    let error1 = {
      code: 201,
      msg: '请选择jpg、png、gif图片'
    };

    let error2 = {
      code: 202,
      msg: '判断失败'
    };

    if ((image ?? '') === '') {
      return error1;
    }

    let type;
    let fileStream;
    // 网络图片
    if (image.slice(0, 7) === 'http://' || image.slice(0, 8) === 'https://') {
      let pic = await axios
        .get(image, {
          responseType: 'arraybuffer'
        })
        .catch(err => err);

      if (!pic) {
        return error2;
      }

      // 判断类型
      if (!/(jpeg|png|gif)$/i.test(pic.headers['content-type'])) {
        return error1;
      }
      type = pic.headers['content-type'];
      fileStream = pic.data;
    } else {
      // 本地图片
      let imagePath = path.resolve(image);
      // 判断是否存在
      if (!fs.existsSync(imagePath)) {
        return error1;
      }

      // 获取文件类型
      const { mime } = await FileType.fromFile(imagePath);

      // 判断类型
      if (!/(jpeg|png|gif)$/i.test(mime)) {
        return error1;
      }
      // 读取文件
      fileStream = fs.readFileSync(imagePath);
      type = mime;
    }

    let model;

    if (this.UseModel) {
      let modelPath = `file://${path.resolve(this.model)}/`;
      modelPath = modelPath.replace(/\\/g, '/');
      model = await load(modelPath, {
        size: 299
      }); // To load a local model, nsfw.load('file://./path/to/model/')
    } else {
      model = await load(); // To load a local model, nsfw.load('file://./path/to/model/')
    }

    // jpg和png判断
    if (/(jpeg|png)$/i.test(type)) {
      // 图像必须tf.tensor3d格式
      // 您可以将图像转换为tf.tensor3d带 tf.node.decodeImage(Uint8Array,channels)
      let img: any;
      try {
        img = node.decodeImage(fileStream, 3);
      } catch (err) {
        // 在这里处理错误。
        console.log(err);

        return error2;
      }

      const predictions = await model.classify(img).catch(err => {
        console.log(err);

        return error2;
      });
      img.dispose(); // 必须显式地管理张量内存(让tf.tentor超出范围才能释放其内存是不够的)。

      return {
        code: 200,
        msg: predictions
      };
    } else if (/(gif)$/i.test(type)) {
      const myConfig = {
        topk: this.gif.topk, //每帧返回的结果数（默认全部为 5）
        fps: this.gif.fps === undefined ? undefined : Number(this.gif.fps) //每秒帧数，从中按比例选取帧（默认为所有帧）
        //   onFrame- 每帧的函数回调 - Param 是一个具有以下键/值的对象：
        // index- 当前分类的 GIF 帧（从 0 开始）
        // totalFrames- 此 GIF 的完整帧数（用于进度计算）
        // predictions- 一个长度数组，topk从分类返回顶部结果
        // image- 特定帧的图像
        // onFrame: ({ index, totalFrames, predictions, image }) => {
        //     //   console.log({ index, totalFrames });
        // }
      };

      const predictions = await model
        .classifyGif(fileStream, myConfig)
        .catch(() => {
          return error2;
        });

      return {
        code: 200,
        msg: predictions
      };
    } else {
      return error1;
    }
  }
}

// export default new nsfwjsApi();
export=new nsfwjsApi()