from flask import Flask, request, render_template, jsonify
import openai

app = Flask(__name__, template_folder='templates')

# Replace with your OpenAI API key
OPENAI_API_KEY = 'YOUE_API_KEY_HERE'
openai.api_key = OPENAI_API_KEY

# Initialize AI state and last response as global variables
ai_state = "inactive"
last_response = ""

@app.route('/')
def index():
    # Render the HTML template and pass the AI state to it
    return render_template('index.html', ai_state=ai_state)

@app.route('/activate_assistant', methods=['POST'])
def activate_assistant():
    # Set the AI state to "listening" when activated
    global ai_state
    ai_state = "listening"
    return jsonify({"message": "AI activated"})

@app.route('/ask_question', methods=['POST'])
def ask_question():
    global ai_state, last_response

    if ai_state == "listening":
        user_question = request.form['question']

        try:
            # Generate a response using OpenAI
            last_response = generate_openai_response(user_question)
            return jsonify({"response": last_response})
        except Exception as e:
            print("OpenAI API Error:", str(e))

    # If AI is not listening or there's an error, return a message
    return jsonify({"message": "AI is sleeping. Wake it up by saying 'Microbot'."})

def generate_openai_response(user_question):
    try:
        response = openai.Completion.create(
            engine="gpt-3.5-turbo-instruct",
            prompt=f"'{user_question}'",
            max_tokens=100,
            n=1,
            stop=None,
            temperature=0.7,
        )

        if response.choices and response.choices[0].text:
            return response.choices[0].text.strip()
        else:
            return "I couldn't understand the question."

    except Exception as e:
        print("OpenAI API Error:", str(e))
        return "I encountered an error while processing the question."

if __name__ == '__main__':
    app.run(debug=True)
