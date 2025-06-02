from datasets import load_dataset
import json
import pandas as pd

def export_to_json(json_path="data/video_mme.json"):
    # 1. Tải dataset (split “train”)
    ds = load_dataset("lmms-lab/Video-MME")["test"]

    # 2. Biến Dataset thành pandas.DataFrame
    #    Hugging Face Dataset có thể gọi .to_pandas() trực tiếp (nếu phiên bản datasets >= 2.x)
    try:
        df = ds.to_pandas()  
    except:
        # Nếu không có to_pandas(), bấm vào từng phần tử rồi tạo DataFrame
        df = pd.DataFrame(ds[:])  

    # 3. Xuất DataFrame dưới dạng JSON – 'records' (mỗi dòng thành 1 object)
    df.to_json(json_path, orient="records", force_ascii=False, lines=False)
    # orient="records" sẽ tạo kiểu: [ {cột1:val, cột2:val, …}, {...}, … ]

    print(f"Đã xuất JSON (array of objects): {json_path}, số bản ghi = {len(df)}")

if __name__ == "__main__":
    export_to_json()