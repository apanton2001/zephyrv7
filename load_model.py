import timm
import torch
from PIL import Image
from torchvision import transforms
import json

def load_mobilenet():
    try:
        print("Loading MobileNetV3 Small model from Hugging Face hub...")
        model = timm.create_model("hf_hub:timm/mobilenetv3_small_100.lamb_in1k", pretrained=True)
        
        # Verify model loaded successfully
        if model is not None:
            print("\nModel loaded successfully!")
            print(f"Model architecture: {model.__class__.__name__}")
            print(f"Number of parameters: {sum(p.numel() for p in model.parameters()):,}")
            
            # Set model to eval mode
            model.eval()
            return model
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return None

def predict_image(model, image_path, top_k=5):
    try:
        # Load and preprocess the image
        img = Image.open(image_path).convert('RGB')
        
        # Define preprocessing pipeline
        preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        # Preprocess image
        img_tensor = preprocess(img)
        img_tensor = img_tensor.unsqueeze(0)  # Add batch dimension
        
        # Get predictions
        with torch.no_grad():
            output = model(img_tensor)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            
        # Get top k predictions
        top_probs, top_indices = torch.topk(probabilities, top_k)
        
        # Load ImageNet class labels
        labels = timm.data.load_class_map('imagenet')
        
        # Print predictions
        print(f"\nTop {top_k} predictions for {image_path}:")
        predictions = []
        for i in range(top_k):
            label = labels[top_indices[i].item()]
            prob = top_probs[i].item() * 100
            print(f"{label}: {prob:.2f}%")
            predictions.append((label, prob))
            
        return predictions
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return None

def main():
    # Load the model
    model = load_mobilenet()
    if model is None:
        return
    
    # Example usage
    print("\nTo use the model, call predict_image() with an image path:")
    print("Example: predictions = predict_image(model, 'path/to/your/image.jpg')")
    print("\nThe model expects RGB images and will return top 5 predictions with confidence scores.")

if __name__ == "__main__":
    main()
