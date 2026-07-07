import datetime
import os
import subprocess
import sys
import time
import webbrowser
import speech_recognition as sr
import shutil

# Premium Terminal Styling Elements
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_header():
    print(f"\n{Colors.BLUE}{Colors.BOLD}==================================================")
    print("           🎤 LAKSHYA 2047 VOICE ASSISTANT 🎤           ")
    print(f"=================================================={Colors.END}\n")

def speak(text):
    """Prints the response and reads it aloud using the macOS 'say' command."""
    print(f"{Colors.GREEN}{Colors.BOLD}Assistant:{Colors.END} {text}")
    try:
        # Using macOS native speech synthesizer
        subprocess.run(["say", text], check=True, stdin=subprocess.DEVNULL)
    except Exception as e:
        # Fallback if say command fails
        pass

def get_time():
    return f"The current time is {datetime.datetime.now().strftime('%I:%M %p')}."

def get_date():
    return f"Today is {datetime.datetime.now().strftime('%A, %B %d, %Y')}."

def open_google():
    webbrowser.open("https://www.google.com")
    return "Opening Google in your web browser."

# Dictionary of predefined questions and their responses
PREDEFINED_RESPONSES = {
    "what is your name": "My name is Nova, your Python voice assistant.",
    "how are you": "I am doing excellent, thank you for asking! How can I help you today?",
    "what is the time": get_time,
    "tell me the time": get_time,
    "what is the date": get_date,
    "tell me the date": get_date,
    "who created you": "I was created by a developer using Python on macOS.",
    "who made you": "I was created by a best developer who also created EDITH using Python on macOS.",
    "open google": open_google,


    "what is lakshya 2047": "Lakshya 2047 is a state-of-the-art skill development and innovation center established to provide industry-oriented education, hands-on training, advanced laboratories, and research facilities for students.",
    "when was lakshya 2047 inaugurated": "Lakshya 2047 was inaugurated on 8 May 2026.",
    "who inaugurated lakshya 2047": "Lakshya 2047 was inaugurated by Dr. Jitendra Singh.",
    "who is dr jitendra singh": "Dr. Jitendra Singh is an Indian physician and politician serving as the 18th Minister of Science and Technology and Minister of Earth Sciences since 2024.",
    "who are the partners of lakshya 2047": "Lakshya 2047 has been established in partnership with Parul University, NSDC, and Ethnotech Academy.",

    "tell me about parul university": "Parul University is a premier private university located in Vadodara, Gujarat. It was established in 2015 and is known for its 250-acre campus, NAAC A++ accreditation, innovation, research, and industry-oriented education.",
    "what is nsdc": "The National Skill Development Corporation is a Public Private Partnership under the Ministry of Skill Development and Entrepreneurship, Government of India.",
    "what is ethnotech academy": "Ethnotech Academy is a Bengaluru-based skill development company established in 2013 that partners with educational institutions across India.",

    "how many floors are there in lakshya 2047": "Lakshya 2047 is a five-floor building.",
    "how many labs are on the ground floor": "The Ground Floor contains 14 laboratories, the Board Room, and the CFS Office.",
    "where is the board room": "The Board Room is located on the Ground Floor as GF-10.",
    "what is the board room used for": "The Board Room is used for meetings, presentations, conferences, planning sessions, and administrative discussions.",
    "where is the cfs office": "The CFS Office is located on the Ground Floor.",
    "who works in the cfs office": "The Campus Manager works in the CFS Office and manages GCF Training activities.",

    "which labs are on the right side of the ground floor": "The right side contains NVIDIA Lab, Cisco Lab, ABB Lab-1, Industrial Drives and Control Lab, Home Automation Lab, PLC and SCADA Lab, ABB Lab-2, Microsoft Lab, and AR VR Lab.",
    "which labs are on the left side of the ground floor": "The left side contains ANSYS Lab, Adobe Lab, Autodesk Lab, VLSI Lab, AWS Lab, and Apple Lab.",

    "what is nvidia lab": "The NVIDIA Lab focuses on Artificial Intelligence, Deep Learning, GPU Computing, Robotics, Computer Vision, and High Performance Computing.",
    "what is cisco lab": "The Cisco Lab provides training in networking, routing, switching, cybersecurity, IoT networking, and enterprise network configuration.",
    "what is abb lab 1": "ABB Lab 1 focuses on industrial robotics, automation systems, smart manufacturing, and robot programming.",
    "what is industrial drives and control lab": "The Industrial Drives and Control Lab provides training in PLCs, motor control, industrial control panels, IoT modules, heavy-duty motors, and automation systems.",
    "what is home automation lab": "The Home Automation Lab focuses on IoT and Smart Home Automation using ESP32, STM32, Zigbee, Z-Wave, Wi-Fi, Home Assistant, and Docker.",
    "what is plc and scada lab": "The PLC and SCADA Lab provides practical training in PLC programming, SCADA software, process automation, industrial logic development, and plant monitoring.",
    "what is abb lab 2": "ABB Lab 2 focuses on robotics, industrial automation, simulation technologies, laboratory automation, and data management systems.",
    "what is microsoft lab": "The Microsoft Lab supports Artificial Intelligence, Azure Cloud Computing, Azure Lab Services, Virtual Machines, software development, and hackathon projects.",
    "what is ar vr lab": "The AR VR Lab is equipped with Meta Quest headsets, motion sensors, Unity, and Blender for immersive learning and application development.",
    "what is ansys lab": "The ANSYS Lab specializes in Finite Element Analysis, Computational Fluid Dynamics, Thermal Analysis, and Electromagnetic Simulation.",
    "what is adobe lab": "The Adobe Lab supports technology previews, developer labs, creative software, multimedia design, and corporate research.",
    "what is autodesk lab": "The Autodesk Lab focuses on CAD design, product design, digital manufacturing, workforce readiness, and AI applications.",
    "what is vlsi lab": "The VLSI Lab is dedicated to designing, simulating, testing, and prototyping integrated circuits and microchips.",
    "what is aws lab": "The AWS Lab provides hands-on cloud computing experience with AWS services, cloud architecture, certification preparation, and AWS console management.",
    "what is apple lab": "The Apple Lab provides training in Swift Programming, Xcode, iOS Development, and macOS Development using iMacs and MacBooks.",

    "what is room 101": "Room 101 is the RPTO Operation Setup Lab used for commercial drone pilot training.",
    "what is room 102": "Room 102 is the Drone Technician Lab.",
    "what is room 103": "Room 103 is the Drone Battery System Repair Lab.",
    "what is room 104": "Room 104 is the Prototyping Zone.",
    "what is room 105": "Room 105 is the Material Synthesis Zone.",
    "what is room 106": "Room 106 is the Major Machine Zone.",
    "what is room 107": "Room 107 is the Minor Machine Zone.",
    "what is room 108": "Room 108 is the Activity Room.",
    "what is room 109": "Room 109 is the Staff Room.",
    "what is room 110": "Room 110 is the Mind Lab.",

    "where is the seminar hall on first floor": "The First Floor Seminar Hall is Room 118.",
    "where is the seminar hall on second floor": "The Second Floor Seminar Hall is Room 216.",
    "where is the seminar hall on third floor": "The Third Floor Seminar Hall is Room 316.",
    "where is the seminar hall on fourth floor": "The Fourth Floor Seminar Hall is Room 416.",
    "where is the seminar hall on fifth floor": "The Fifth Floor Seminar Hall is Room 516.",

    "who is the lakshya manager": "Divyesh Hariyani is a Manager - Center for Future Skills (cfs) & Assistant Professor at Parul Institute of Engineering and Technology, Parul University, Vadodara"
}


def process_command(command_text):
    """Matches the user command against predefined questions."""
    command_text = command_text.lower().strip()
    
    # Check for exit commands
    if any(exit_cmd in command_text for exit_cmd in ["exit", "stop", "bye", "quit", "goodbye"]):
        speak("Goodbye! Have a wonderful day.")
        return True # Signal to stop the assistant
        
    matched = False
    
    # 1. First check for a direct substring match
    for pattern, response in PREDEFINED_RESPONSES.items():
        if pattern in command_text:
            if callable(response):
                speak(response())
            else:
                speak(response)
            matched = True
            break
            
    # 2. Dynamic Keyword Overlap Matching Fallback
    if not matched:
        # Stop words to ignore when comparing queries (keeps question intent words like 'who', 'when', 'where', 'how')
        STOP_WORDS = {
            "is", "are", "the", "in", "on", "of", "about", 
            "for", "there", "to", "a", "an", "tell", "me", "here",
            "was", "by", "has", "been", "with", "does", "focused", "focuses", 
            "provide", "provides", "its", "it", "at", "as", "used"
        }
        
        # Tokenize and filter user input
        user_words = set(command_text.replace("?", "").replace(",", "").split())
        user_keywords = user_words - STOP_WORDS
        
        best_match_key = None
        max_overlap_count = 0
        
        if user_keywords:
            for pattern in PREDEFINED_RESPONSES.keys():
                # Tokenize and filter pattern key
                pattern_words = set(pattern.replace("?", "").replace(",", "").split())
                pattern_keywords = pattern_words - STOP_WORDS
                
                # Check for intersection
                common_keywords = user_keywords.intersection(pattern_keywords)
                overlap_count = len(common_keywords)
                
                if overlap_count > max_overlap_count:
                    max_overlap_count = overlap_count
                    best_match_key = pattern
                    
        # Match if at least one keyword matches
        if best_match_key and max_overlap_count >= 1:
            # Avoid matching purely on weak/generic words like "who", "what", "where", "you" to prevent false positives
            WEAK_WORDS = {"who", "what", "where", "when", "how", "why", "which", "many", "you", "your"}
            
            # Recalculate intersection keywords for the best match
            best_pattern_words = set(best_match_key.replace("?", "").replace(",", "").split())
            best_pattern_keywords = best_pattern_words - STOP_WORDS
            matching_keywords = user_keywords.intersection(best_pattern_keywords)
            
            # If the only matching words are generic/weak words, reject the match
            if matching_keywords.issubset(WEAK_WORDS):
                matched = False
            else:
                response = PREDEFINED_RESPONSES[best_match_key]
                if callable(response):
                    speak(response())
                else:
                    speak(response)
                matched = True
            
    if not matched:
        speak("I am sorry, I do not know the answer to that question.")
        
    return False

def listen_voice(recognizer, microphone):
    """Listens for audio input from the microphone and uses Google Speech Recognition to convert to text."""
    with microphone as source:
        print(f"\n{Colors.BLUE}Listening...{Colors.END} (Speak now)")
        try:
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=5)
        except sr.WaitTimeoutError:
            print(f"{Colors.YELLOW}No speech detected (timeout).{Colors.END}")
            return ""

    print(f"{Colors.BLUE}Processing voice input...{Colors.END}")
    try:
        # Recognized text
        text = recognizer.recognize_google(audio)
        print(f"{Colors.BOLD}You said:{Colors.END} \"{text}\"")
        return text
    except sr.UnknownValueError:
        print(f"{Colors.RED}Sorry, I couldn't understand what you said.{Colors.END}")
        speak("Sorry, I could not catch that. Could you repeat?")
        return ""
    except sr.RequestError as e:
        print(f"{Colors.RED}Could not request results from Google Speech Recognition service; {e}{Colors.END}")
        speak("I am having trouble accessing my speech recognition service. Please check your internet connection.")
        return ""

def main():
    print_header()
    
    # Initialize speech recognition components
    recognizer = sr.Recognizer()
    microphone = None
    
    # Try to initialize microphone
    try:
        microphone = sr.Microphone()
        # Verify microphone works and calibrate for ambient noise once
        print("Calibrating microphone for ambient noise... Please stand by.")
        with microphone as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.8)
            
        # Check if 'flac' command line tool is installed (needed for SpeechRecognition)
        if not shutil.which("flac"):
            print(f"{Colors.YELLOW}Warning: 'flac' command-line tool not found on PATH. It is required for Google Speech Recognition.{Colors.END}")
            print(f"You can install it using Homebrew: {Colors.BOLD}brew install flac{Colors.END}")
            print("Falling back to Text Mode.")
            microphone = None
    except Exception as e:
        print(f"{Colors.YELLOW}Warning: Microphone could not be accessed ({e}). Falling back to Text Mode.{Colors.END}")
        microphone = None

    # Let the user choose input mode if microphone is available
    mode = "2"
    if microphone is not None:
        print("Please choose an input mode:")
        print(f"1. {Colors.BOLD}Voice Mode{Colors.END} (Speak using microphone)")
        print(f"2. {Colors.BOLD}Text Mode{Colors.END} (Type your questions)")
        choice = input(f"\nEnter choice ({Colors.BOLD}1{Colors.END}/2) [Default is 1]: ").strip()
        if choice == "2":
            mode = "2"
        else:
            mode = "1"
    else:
        print(f"{Colors.YELLOW}No microphone detected or permission denied. Starting in Text Mode.{Colors.END}")
        mode = "2"

    if mode == "1":
        speak("Hello! I am Lakshya agent.")
        while True:
            command = listen_voice(recognizer, microphone)
            if command:
                should_exit = process_command(command)
                if should_exit:
                    break
            time.sleep(0.1)
    else:
        speak("Hello! Text Mode activated. Type your questions below.")
        while True:
            try:
                command = input(f"\n{Colors.BLUE}Ask a question (or type 'exit'):{Colors.END} ").strip()
                if not command:
                    continue
                should_exit = process_command(command)
                if should_exit:
                    break
            except (KeyboardInterrupt, EOFError):
                speak("Goodbye!")
                break

if __name__ == "__main__":
    main()
