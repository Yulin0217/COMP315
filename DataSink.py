from holoscan.core import Operator
import cupy as cp
import numpy as np
import socket
from queue import Queue
from threading import Thread

class DataSink(Operator):
    def __init__(self):
        super().__init__()
        self.queue = Queue()
        self.host = "172.30.28.152"
        self.port = 13000
        self.running = True

        # 启动后台线程处理队列中的数据
        self.sender_thread = Thread(target=self._send_data_worker, daemon=True)
        self.sender_thread.start()

    def setup(self, spec):
        spec.input("in")  

    def _send_data_worker(self):
        """后台线程，负责发送队列中的数据"""
        while self.running or not self.queue.empty():
            try:
                data_to_send = self.queue.get(timeout=1)  # 从队列中取出数据
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                    sock.connect((self.host, self.port))
                    sock.sendall(data_to_send)
                    print(f"Data sent: {data_to_send}")
                self.queue.task_done()
            except Exception as e:
                print(f"Error during TCP/IP transmission: {e}")

    def compute(self, op_input, op_output, context):
        """接收数据并推送到队列"""
        # Receive data from the input port
        pose_data = op_input.receive("in")

        # Convert the data to a NumPy array
        pose_array = cp.asnumpy(cp.asarray(pose_data.get("pose"), order="C"))

        # Convert to bytes for TCP/IP transmission
        xyz_bytes = pose_array.astype(np.float32).tobytes()
        data_to_send = xyz_bytes + b'\n'

        # 将数据推送到队列中
        self.queue.put(data_to_send)

    def stop(self):
        """停止后台线程"""
        self.running = False
        self.sender_thread.join()
