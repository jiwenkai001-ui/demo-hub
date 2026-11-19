synthetic-video.mp4 是由 FFmpeg testsrc2 生成的3秒合成测试图案，无外部拍摄内容。

体验回归脚本将此可解码 MP4 加入填充字节至大于4MB，以覆盖前端超限判断、实际解码、Canvas/MediaRecorder重编码与服务端保存校验。浏览器需真实读取视频帧并生成新的WebM，未伪造压缩返回值。测试不依赖FFmpeg运行时。
