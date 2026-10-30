# ASTC decoder attribution

`original-astc.wasm` is built from AssetStudio-Haruki's `Texture2DDecoderNative/astc.cpp` and its headers at
revision `00e57b5ad2aeb18aa5abf2352988ed8cedcfbbeb` (unchanged at `70e6ec3`). The build derives `astc16.cpp` from
that unmodified file with `scripts/build/original-astc/make-astc16.py`: LDR blocks decode to the ASTC specification's
UNORM16 channel values instead of AssetStudio's 8-bit approximation, and HDR content is rejected. The small
freestanding libc shims and the `decode_rgba16` entry point are in `source/`. Rebuild with
`bash scripts/build/build-original-astc-decoder.sh` (Clang with WebAssembly support and wasm-ld; no Emscripten runtime).
The module has no imports. It exports memory, __heap_base and decode_rgba16.

## AssetStudio MIT license

MIT License

Copyright (c) 2016 Radu
Copyright (c) 2016-2022 Perfare
Copyright (c) 2021-2025 aelurum

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## FP16 notices

#pragma once
#ifndef FP16_H
#define FP16_H

#include "fp16/fp16.h"

#endif /* FP16_H */

/*
 *
 * License Information
 *
 * FP16 library is derived from https://github.com/Maratyszcza/FP16.
 * The library is licensed under the MIT License shown below.
 *
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Facebook Inc.
 * Copyright (c) 2017 Georgia Institute of Technology
 * Copyright 2019 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

## Endianness notices

/*
 *
 * License Information
 *
 * endianness.h is derived from https://gist.github.com/jtbr/7a43e6281e6cca353b33ee501421860c
 * The file is licensed under the MIT License shown below.
 *
 *
 * The MIT License (MIT)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
