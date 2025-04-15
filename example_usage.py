from load_model import load_mobilenet, predict_image

def run_example():
    # Load the model
    model = load_mobilenet()
    if model is None:
        return
    
    # You can use the model to predict any image by providing its path
    # Example usage with Python code:
    """
    # Single image prediction
    predictions = predict_image(model, 'path/to/image.jpg')
    
    # Process multiple images
    image_paths = ['image1.jpg', 'image2.jpg', 'image3.jpg']
    for image_path in image_paths:
        predictions = predict_image(model, image_path)
    """
    
    print("\nTo use this model:")
    print("1. Import the functions:")
    print("   from load_model import load_mobilenet, predict_image")
    print("\n2. Load the model:")
    print("   model = load_mobilenet()")
    print("\n3. Make predictions:")
    print("   predictions = predict_image(model, 'path/to/your/image.jpg')")
    print("\nThe model will return the top 5 predictions with confidence scores.")
    print("The model expects RGB images and will automatically handle resizing and normalization.")

if __name__ == "__main__":
    run_example()
