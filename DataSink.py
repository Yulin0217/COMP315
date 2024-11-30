from holoscan.core import Operator
import cupy as cp
import numpy as np
import socket
from queue import Queue
from threading import Thread

class DataSink(Operator):
    def __init__(self):
        super().__init__()
        # 初始化队列和参数
        self.queue = Queue()
        self.host = "172.30.28.152"
        self.port = 13000
        self.running = True

        # 打印队列初始化信息
        print("Queue initialized:", type(self.queue))  # 应输出 <class 'queue.Queue'>

        # 启动后台线程
        self.sender_thread = Thread(target=self._send_data_worker, daemon=True)
        self.sender_thread.start()

    def setup(self, spec):
        spec.input("in")  

    def _send_data_worker(self):
        """后台线程，负责从队列中获取数据并发送"""
        print("Send data worker started")
        while self.running or not self.queue.empty():
            try:
                data_to_send = self.queue.get(timeout=1)  # 从队列中取出数据
                print(f"Got data from queue: {data_to_send}")  # 打印从队列取出的数据
                if isinstance(data_to_send, bytes):  # 确保数据是字节流
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                        sock.connect((self.host, self.port))
                        sock.sendall(data_to_send)
                        print(f"Data sent: {data_to_send}")
                else:
                    print(f"Invalid data type in queue: {type(data_to_send)}")
                self.queue.task_done()
            except Exception as e:
                print(f"Error during TCP/IP transmission or queue handling: {e}")

    def compute(self, op_input, op_output, context):
        """接收数据并推送到队列"""
        try:
            # 从输入端接收数据
            pose_data = op_input.receive("in")

            # 转换为 NumPy 数组
            pose_array = cp.asnumpy(cp.asarray(pose_data.get("pose"), order="C"))

            # 转换为字节序列
            xyz_bytes = pose_array.astype(np.float32).tobytes()
            data_to_send = xyz_bytes + b'\n'

            # 打印数据调试信息
            print("Type of data_to_send:", type(data_to_send))
            print("Content of data_to_send (bytes):", data_to_send[:20], "...")  # 打印前20字节

            # 推送到队列
            self.queue.put(data_to_send)
        except Exception as e:
            print(f"Error in compute method: {e}")

    def stop(self):
        """停止后台线程"""
        self.running = False
        self.sender_thread.join()
