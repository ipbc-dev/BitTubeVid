#!/usr/bin/python3

import subprocess, os, sys, logging
from logging.handlers import RotatingFileHandler

get_gpu_util_cmd = ["nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv"]
ffmpeg_binary = "/usr/bin/ffmpeg_nvenc_x264"
ffmpeg_prepend = "-hwaccel cuvid -hwaccel_device {gpu_device} -c:v h264_cuvid"
ffmpeg_append = "-y -gpu {gpu_device}"

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

#console log handler
handler = logging.StreamHandler()
handler.setLevel(20)
formatter = logging.Formatter(fmt='%(asctime)s %(levelname)-8s %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
handler.setFormatter(formatter)
logger.addHandler(handler)

#rotating log file handler
handler = RotatingFileHandler("/home/bittubeofficial/ffmpeg_gpu_wrapper.log", maxBytes=1048576, backupCount=1)
handler.setLevel(20)
formatter = logging.Formatter(fmt='%(asctime)s %(levelname)-8s %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
handler.setFormatter(formatter)
logger.addHandler(handler)

logger.info('STARTED %s' % sys.argv[0])


p = subprocess.Popen(get_gpu_util_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
out, err = p.communicate()

gpu_util = {}
if out != "":
  for line in out.splitlines():
    line = str(line)
    if "utilization" in line: continue

    try:
      util = int(line.split(" %")[0].split("b'")[1])
    except:
      logger.error("ERROR getting GPU utilization (%s)" % line)
      util = 0

    if "gpu0" in gpu_util.keys():
      gpu_util["gpu1"] = util
    else:
      gpu_util["gpu0"] = util

logger.info("GPU utilization: %s" % str(gpu_util))
gpu_to_use = min(gpu_util, key=gpu_util.get)
gpu_to_use = gpu_to_use.split("gpu")[1]
logger.info("GPU to use: %s" % gpu_to_use)

args = sys.argv
args.pop(0)
ffmpeg_cmd = " ".join(args)

if ffmpeg_cmd == "":
  logger.critical("ERROR, unrecognized ffmpeg command")
  sys.exit(1)

ffmpeg_cmd = ffmpeg_cmd.replace("/usr/bin/ffmpeg ", "")
ffmpeg_cmd = ffmpeg_cmd.replace("ffmpeg", "")

new_ffmpeg_cmd = ""

no_encode_formats = [".webm", ".jpeg", ".jpg", ".mp3"]
for extension in no_encode_formats:
  if extension in ffmpeg_cmd:
    new_ffmpeg_cmd = ffmpeg_binary + " " + ffmpeg_cmd
    break
else:
  new_ffmpeg_cmd = ffmpeg_binary + " " + ffmpeg_prepend.format(gpu_device=gpu_to_use) + " " + ffmpeg_cmd.replace("-y", ffmpeg_append.format(gpu_device=gpu_to_use))

logger.info("excuting: %s" % new_ffmpeg_cmd)
os.system(new_ffmpeg_cmd)
