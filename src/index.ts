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
   * @description:  返回的结果数（默认全部为 5）
   * @return {*}
   */
  topk?: number;

  constructor() {
    //模型位置
    this.model = path.resolve(process.cwd(), 'model');
    this.UseModel = false;
    this.topk = 5;
  }

  /**
   * @description:  copy模型文件夹, UseModel为false时无效  模型文件 https://github.com/infinitered/nsfwjs/tree/master/models/inception_v3
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
    if (fs.existsSync(this.model) && fs.readdirSync(this.model).toString() !== '') {
      return;
    }

    // 复制文件
    fs.cpSync(path.resolve(__dirname, '..', 'model'), this.model, {
      recursive: true
    });
  }

  /**
   * @description:  鉴图
   * @param {string} image 图片地址 可以是 https | http | 图片路径 |Buffer
   * @return {*}
   */
  async identificationOfPictures(image: string | Buffer) {
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
    // buffer
    if (Buffer.isBuffer(image)) {
      // 获取文件类型
      const mime = (await FileType.fromBuffer(image))?.mime;
      if (!mime) {
        return error1;
      }
      // 判断类型
      if (!/(jpeg|png|gif)$/i.test(mime)) {
        return error1;
      }
      // 读取文件
      fileStream = image;
      type = mime;
    }
    // 网络图片
    else if (image.slice(0, 7) === 'http://' || image.slice(0, 8) === 'https://') {
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
      const mime = (await FileType.fromFile(imagePath))?.mime;
      if (!mime) {
        return error1;
      }

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
      model = await load('InceptionV3'); // To load a local model, nsfw.load('file://./path/to/model/')
    }

    if (/(jpeg|png|gif)$/i.test(type)) {
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

      const predictions = await model.classify(img, this.topk).catch(err => {
        console.log(err);

        return error2;
      });
      img.dispose(); // 必须显式地管理张量内存(让tf.tentor超出范围才能释放其内存是不够的)。

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
export = new nsfwjsApi();
