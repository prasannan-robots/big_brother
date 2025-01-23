# from flask import Flask, request, jsonify

# app = Flask(__name__)

# # I need a / route which accepts an image url in post and return true
# @app.route('/', methods=['POST'])
# def index():
#     # get the image url from the post request
#     data = request.get_json()
#     image_url = data.get('imageUrl')
#     print(image_url)
    
#     # Dummy logic to determine if the image is a scam
#     is_scam = True  # Replace with actual logic
    
#     return jsonify({'isScam': is_scam})

# if __name__ == '__main__':
#     app.run(debug=True)

from transformers import AutoProcessor, AutoModelForCausalLM
from huggingface_hub import hf_hub_download
from PIL import Image

processor = AutoProcessor.from_pretrained("microsoft/git-base-textvqa")
model = AutoModelForCausalLM.from_pretrained("microsoft/git-base-textvqa")

file_path = hf_hub_download(repo_id="nielsr/textvqa-sample", filename="bus.png", repo_type="dataset")
image = Image.open(file_path).convert("RGB")

pixel_values = processor(images=image, return_tensors="pt").pixel_values

question = "what does the front of the bus say at the top?"

input_ids = processor(text=question, add_special_tokens=False).input_ids
input_ids = [processor.tokenizer.cls_token_id] + input_ids
input_ids = torch.tensor(input_ids).unsqueeze(0)

generated_ids = model.generate(pixel_values=pixel_values, input_ids=input_ids, max_length=50)
print(processor.batch_decode(generated_ids, skip_special_tokens=True))
['what does the front of the bus say at the top? special']