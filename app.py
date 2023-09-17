from flask import Flask, request, render_template, jsonify
import openai

app = Flask(__name__, template_folder='templates')

# Replace with your OpenAI API key
OPENAI_API_KEY = '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'

# Initialize the OpenAI API client
openai.api_key = OPENAI_API_KEY

# Global variable to track AI state
ai_state = "inactive"  # Possible states: "inactive", "listening"

# Variable to store the last AI response
last_response = ""

@app.route('/')
def index():
    return render_template('index.html', ai_state=ai_state)

@app.route('/activate_assistant', methods=['POST'])
def activate_assistant():
    global ai_state
    ai_state = "listening"  # AI is activated and listening
    return jsonify({"message": "AI activated"})

@app.route('/ask_question', methods=['POST'])
def ask_question():
    global ai_state
    global last_response

    if ai_state == "listening":
        user_question = request.form['question']
        print("Received question:", user_question)

        try:
            # Use OpenAI's GPT-3 to generate a response
            last_response = generate_openai_response(user_question)
            print("OpenAI Response:", last_response)
            return jsonify({"response": last_response})
        except Exception as e:
            # Log any exception that occurred during the API request
            print("OpenAI API Error:", str(e))

    return jsonify({"message": "AI is sleeping. Wake it up by saying 'Microbot'."})

# Modify the generate_openai_response function to return only the answer
def generate_openai_response(user_question):
    try:
        print("API Request Parameters:", {
            "engine": "text-davinci-002",
            "prompt": f"{user_question}'",
            "max_tokens": 100,
            "n": 1,
            "stop": None,
            "temperature": 0.7,
        })

        response = openai.Completion.create(
            engine="text-davinci-002",
            prompt=f"'{user_question}'",
            max_tokens=100,
            n=1,
            stop=None,
            temperature=0.7,
        )

        print("OpenAI API Response:", response)

        # Extract and return the answer from response.choices
        if response.choices and response.choices[0].text:
            return response.choices[0].text.strip()
        else:
            return "I couldn't understand the question."

    except Exception as e:
        print("OpenAI API Error:", str(e))
        return "I encountered an error while processing the question."

if __name__ == '__main__':
    app.run(debug=True)
