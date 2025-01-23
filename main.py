from flask import Flask, request, jsonify

app = Flask(__name__)

# I need a / route which accepts an image url in post and return true
@app.route('/', methods=['POST'])
def index():
    # get the image url from the post request
    data = request.get_json()
    image_url = data.get('imageUrl')
    print(image_url)
    
    # Dummy logic to determine if the image is a scam
    is_scam = True  # Replace with actual logic
    
    return jsonify({'isScam': is_scam})

if __name__ == '__main__':
    app.run(debug=True)