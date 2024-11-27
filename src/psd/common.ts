import * as fs from 'fs';
import * as path from 'path';
import 'ag-psd/initialize-canvas';
import { Layer, Psd, ReadOptions, readPsd } from 'ag-psd';
import { Canvas } from 'canvas';

export function readPsdFromFile(filepath: string, options?: ReadOptions): Psd {
  const buffer = fs.readFileSync(filepath);
  return readPsd(buffer, options);
}

export function extractPSD(targetPath: string, psd: Psd): void {
  if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath);

  const s = findCanvasFields(psd);
  console.log(s);

  if (psd.canvas) {
    const canvasPath: string = path.join(targetPath, 'canvas.png');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    fs.writeFileSync(canvasPath, psd.canvas.toBuffer());
    psd.canvas = undefined;
    psd['canvasUrl'] = canvasPath;
  }

  if (psd.imageResources) {
    if (psd.imageResources.thumbnail) {
      const thumbnailPath: string = path.join(targetPath, 'thumbnail.png');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      fs.writeFileSync(thumbnailPath, psd.imageResources.thumbnail.toBuffer());
      psd.imageResources.thumbnail = undefined;
      psd.imageResources['thumbnailUrl'] = thumbnailPath;
    }

    if (psd.imageResources.xmpMetadata) {
      const xmpMetadataPath: string = path.join(targetPath, 'xmpMetadata.xml');
      fs.writeFileSync(xmpMetadataPath, psd.imageResources.xmpMetadata);
      psd.imageResources.xmpMetadata = undefined;
      psd.imageResources['xmpMetadataUrl'] = xmpMetadataPath;
    }
  }

  if (psd.engineData) {
    const engineDataPath: string = path.join(targetPath, 'engineData');
    const data = Buffer.from(psd.engineData, 'base64');
    fs.writeFileSync(engineDataPath, data);
    psd.engineData = undefined;
    psd['engineDataUrl'] = engineDataPath;
  }

  if (psd.linkedFiles) {
    const currentPath = path.join(targetPath, `/linkedFiles`);
    if (!fs.existsSync(currentPath)) fs.mkdirSync(currentPath);

    for (const file of psd.linkedFiles) {
      const filePath: string = path.join(currentPath, `/${file.id}.${file.type}`);
      fs.writeFileSync(filePath, file.data);
      file.data = undefined;
      file['dataUrl'] = filePath;
    }
  }

  //处理children
  traverseTreeDFSWrapper(psd.children, targetPath);

  fs.writeFileSync(path.join(targetPath, 'data.json'), JSON.stringify(psd, null, 2));
}

function traverseTreeDFSWrapper(tree: Layer[], treePath: string): void {
  const layerPath: string = path.join(treePath, 'layer');

  for (const root of tree) {
    traverseTreeDFS(root, layerPath);
  }
}

function traverseTreeDFS(node: Layer, parentPath: string): void {
  nodeHandler(node, parentPath);

  if (node.children) {
    const currentPath: string = path.join(parentPath, path.sep, node.id.toString());

    for (const child of node.children) {
      traverseTreeDFS(child, currentPath);
    }
  }
}

function nodeHandler(node: Layer, parentPath: string): void {
  if (!node.canvas && !(node.mask && node.mask.canvas)) {
    console.log(`Visiting node: ${node.id} - ${node.name} - null`);
    return;
  }

  if (!fs.existsSync(parentPath)) {
    fs.mkdirSync(parentPath, { recursive: true });
  }

  if (node.canvas) {
    const imagePath: string = path.join(parentPath, path.sep, `${node.id}.png`);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const imageData: Buffer = node.canvas.toBuffer();
    fs.writeFileSync(imagePath, imageData);
    node.canvas = undefined; //删除图像数据，用于导出json
    node['canvasUrl'] = imagePath;
    console.log(`Visiting node: ${node.id} - ${node.name} - ${imagePath}`);
  }

  if (node.mask && node.mask.canvas) {
    const imagePath: string = path.join(parentPath, path.sep, `${node.id}-mask.png`);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const imageData: Buffer = node.mask.canvas.toBuffer();
    fs.writeFileSync(imagePath, imageData);
    node.mask.canvas = undefined; //删除图像数据，用于导出json
    node.mask['canvasUrl'] = imagePath;
    console.log(`Visiting node: ${node.id} - ${node.name} - mask - ${imagePath}`);
  }
}

// 函数来检查对象字段是否为Canvas类型
function findCanvasFields(obj: any, path: string = ''): string[] {
  let canvasFields: string[] = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (value instanceof Object && !(value instanceof Canvas) && !(value instanceof Uint8Array)) {
        // 如果当前字段是对象，并且不是Canvas类型，则递归遍历
        canvasFields = canvasFields.concat(findCanvasFields(value, currentPath));
      } else if (value instanceof Canvas) {
        // 如果当前字段是Canvas类型，则记录路径
        canvasFields.push(currentPath);
      }
    }
  }

  return canvasFields;
}
