import * as fs from 'fs';
import * as path from 'path';
import 'ag-psd/initialize-canvas';
import { readPsd } from 'ag-psd';
import { extractPSD } from './common';

const resultsPath = path.join(__dirname, '../../testdata/results');
// const resultsPath = path.join(__dirname, '..', '..', 'testdata');

// const filepath = '/Users/8btc/my/work/maze-studio/code/psd-parser/testdata/女装清仓.psd';
const filepath = '/Users/8btc/my/work/maze-studio/code/psd-parser/testdata/font-test.psd';
const buffer = fs.readFileSync(filepath);
const psd = readPsd(buffer);
extractPSD(resultsPath, psd);
console.log(psd);
