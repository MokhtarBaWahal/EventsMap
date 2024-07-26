from flask import Flask, render_template, jsonify, request
import json

app = Flask(__name__)


# Load events data from JSON file
def load_events():
    with open('events.json') as f:
        return json.load(f)


# Save events data to JSON file
def save_events(events_data):
    with open('events.json', 'w') as f:
        json.dump(events_data, f, indent=4)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/events/<int:year>')
def get_events(year):
    events_data = load_events()
    events = events_data.get(str(year), [])
    return jsonify(events)


@app.route('/add_event', methods=['POST'])
def add_event():
    new_event = request.json
    events_data = load_events()
    year = str(new_event['year'])
    if year in events_data:
        events_data[year].append(new_event)
    else:
        events_data[year] = [new_event]
    save_events(events_data)
    return jsonify({'status': 'success'}), 201


if __name__ == '__main__':
    app.run()
