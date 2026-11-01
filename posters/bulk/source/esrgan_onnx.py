"""Build an ONNX SRVGGNetCompact (Real-ESRGAN realesr-general-x4v3) from the .pth zip.
The pickle is only DISASSEMBLED with pickletools (no unpickling / no code execution);
tensor bytes are read directly from the zip's raw storage files."""
import io, re, sys, zipfile, pickletools, numpy as np, onnx
from onnx import helper, TensorProto, numpy_helper

pth, out = sys.argv[1], sys.argv[2]
z = zipfile.ZipFile(pth)
root = z.namelist()[0].split('/')[0]
ops = [(op.name, arg) for op, arg, _ in pickletools.genops(io.BytesIO(z.read(f'{root}/data.pkl')))]
tensors, i = {}, 0
while i < len(ops):
    name, arg = ops[i]
    if name == 'BINUNICODE' and re.fullmatch(r'body\.\d+\.(weight|bias)', arg or ''):
        key = arg; j = i + 1
        while not (ops[j][0] == 'BINUNICODE' and ops[j][1].isdigit()): j += 1
        skey = ops[j][1]; ints = []; j += 1
        while ops[j][0] != 'NEWFALSE':
            if ops[j][0] in ('BININT1', 'BININT2', 'BININT'): ints.append(ops[j][1])
            j += 1
        ints = ints[1:]                                          # drop storage numel
        offset, rest = ints[0], ints[1:]
        shape = rest[:len(rest) // 2]
        buf = np.frombuffer(z.read(f'{root}/data/{skey}'), dtype=np.float32)
        tensors[key] = buf[offset:offset + int(np.prod(shape))].reshape(shape).copy()
        i = j
    i += 1
idx = sorted({int(k.split('.')[1]) for k in tensors})
nodes, inits, cur = [], [], 'input'
for k in idx:
    w = tensors[f'body.{k}.weight']
    if w.ndim == 4:
        inits += [numpy_helper.from_array(w, f'w{k}'), numpy_helper.from_array(tensors[f'body.{k}.bias'], f'b{k}')]
        nodes.append(helper.make_node('Conv', [cur, f'w{k}', f'b{k}'], [f'c{k}'], pads=[1, 1, 1, 1], kernel_shape=[3, 3])); cur = f'c{k}'
    else:
        inits.append(numpy_helper.from_array(w.reshape(-1, 1, 1), f'a{k}'))
        nodes.append(helper.make_node('PRelu', [cur, f'a{k}'], [f'p{k}'])); cur = f'p{k}'
nodes.append(helper.make_node('DepthToSpace', [cur], ['ps'], blocksize=4, mode='CRD'))
inits.append(numpy_helper.from_array(np.array([1, 1, 4, 4], np.float32), 'scales'))
nodes.append(helper.make_node('Resize', ['input', '', 'scales'], ['up'], mode='nearest'))
nodes.append(helper.make_node('Add', ['ps', 'up'], ['output']))
g = helper.make_graph(nodes, 'srvgg', [helper.make_tensor_value_info('input', TensorProto.FLOAT, [1, 3, None, None])],
                      [helper.make_tensor_value_info('output', TensorProto.FLOAT, [1, 3, None, None])], inits)
m = helper.make_model(g, opset_imports=[helper.make_opsetid('', 13)]); m.ir_version = 8
onnx.checker.check_model(m); onnx.save(m, out)
print('tensors', len(tensors), 'layers', len(idx), [tensors[f'body.{idx[0]}.weight'].shape, tensors[f'body.{idx[-1]}.weight'].shape])
