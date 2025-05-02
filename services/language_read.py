import subprocess
import os
import glob
import platform
import sys
import tempfile

# Update the compile_and_run function to accept command line arguments
def compile_and_run(file_path, args=None):
    if args is None:
        args = []
    
    # Convert all arguments to strings to be safe
    args = [str(arg) for arg in args]
    
    # Get the file extension
    _, ext = os.path.splitext(file_path)

    # Get the directory containing the file
    file_dir = os.path.dirname(file_path)
    
    if ext == ".c":
        # C Compilation and Execution - Windows-friendly
        output_binary = os.path.splitext(file_path)[0]
        if platform.system() == "Windows":
            output_binary += ".exe"  # Add .exe extension on Windows

        try:
            # Create compiler command
            compiler_cmd = ["gcc", file_path, "-o", output_binary]
            compile_process = subprocess.run(compiler_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            print(f"C Compilation successful for {file_path}!")
            
            # Run the compiled binary with arguments
            result = subprocess.run([output_binary] + args, check=True, stdout=subprocess.PIPE, text=True)
            return result.stdout.strip()  # Using strip() to remove trailing newlines
        except subprocess.CalledProcessError as e:
            err_msg = e.stderr if hasattr(e, 'stderr') and e.stderr else str(e)
            return f"C Error for {file_path}: {err_msg}"
    elif ext == ".cpp":
        # C++ Compilation and Execution - Windows-friendly
        output_binary = os.path.splitext(file_path)[0]
        if platform.system() == "Windows":
            output_binary += ".exe"  # Add .exe extension on Windows
            
        try:
            compiler_cmd = ["g++", file_path, "-o", output_binary]
            compile_process = subprocess.run(compiler_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            print(f"C++ Compilation successful for {file_path}!")
            result = subprocess.run([output_binary] + args, check=True, stdout=subprocess.PIPE, text=True)
            return result.stdout.strip()  # Using strip() to remove trailing newlines
        except subprocess.CalledProcessError as e:
            err_msg = e.stderr if hasattr(e, 'stderr') and e.stderr else str(e)
            return f"C++ Error for {file_path}: {err_msg}"
    elif ext == ".java":
        # Java Compilation and Execution
        class_name = os.path.splitext(os.path.basename(file_path))[0]
        try:
            # First compile the Java file
            compile_result = subprocess.run(["javac", file_path], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print(f"Java Compilation successful for {file_path}!")
            
            # Then execute from the directory containing the class file
            original_dir = os.getcwd()
            try:
                os.chdir(file_dir)
                result = subprocess.run(["java", class_name] + args, check=True, stdout=subprocess.PIPE, text=True)
                return result.stdout.strip()
            finally:
                os.chdir(original_dir)
        except subprocess.CalledProcessError as e:
            return f"Java Error for {file_path}: {e}"
    elif ext == ".cs":
        # C# Compilation and Execution using dotnet
        try:
            # Directly run the C# file using dotnet
            result = subprocess.run(["dotnet", "run", "--source", file_path] + args, check=True, stdout=subprocess.PIPE, text=True)
            print(f"C# Execution successful for {file_path}!")
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            return f"C# Error for {file_path}: {e}"
    elif ext == ".py":
        # Python Execution - Windows-friendly
        if file_path == "multiple.py":
            return "Skipped execution of multiple.py"
        try:
            # Use 'python' on Windows and 'python3' on other platforms
            python_cmd = "python" if platform.system() == "Windows" else "python3"
            result = subprocess.run([python_cmd, file_path] + args, check=True, stdout=subprocess.PIPE, text=True)
            print(f"Python Execution successful for {file_path}!")
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            return f"Python Error for {file_path}: {e}"
        except FileNotFoundError:
            # If python3 command not found, try python
            try:
                result = subprocess.run(["python", file_path] + args, check=True, stdout=subprocess.PIPE, text=True) 
                print(f"Python Execution successful for {file_path} using python!")
                return result.stdout.strip()
            except subprocess.CalledProcessError as e:
                return f"Python Error for {file_path}: {e}"
    elif ext == ".go":
        # Go Compilation and Execution
        try:
            # Directly run the Go file
            result = subprocess.run(["go", "run", file_path] + args, check=True, stdout=subprocess.PIPE, text=True)
            print(f"Go Execution successful for {file_path}!")
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            return f"Go Error for {file_path}: {e}"
    elif ext == ".js":
        # JavaScript Execution
        try:
            result = subprocess.run(["node", file_path] + args, check=True, stdout=subprocess.PIPE, text=True)
            print(f"JavaScript Execution successful for {file_path}!")
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            return f"JavaScript Error for {file_path}: {e}"
    else:
        return f"Unsupported file type: {ext}"

def detect_language(file_path):
    """Detect programming language based on file extension."""
    _, extension = os.path.splitext(file_path)
    extension = extension.lower()
    
    extension_map = {
        '.py': ('Python', '.py'),
        '.java': ('Java', '.java'),
        '.c': ('C', '.c'),
        '.cpp': ('C++', '.cpp'),
        '.cs': ('C#', '.cs'),
        '.js': ('JavaScript', '.js'),
        '.go': ('Go', '.go'),
    }
    
    return extension_map.get(extension, ('Unknown', extension))

if __name__ == "__main__":
    # Ask the user for the directory path
    directory = input("Enter the path to the directory containing the files: ")

    try:
        # Change to the specified directory
        os.chdir(directory)
        print(f"Changed directory to {directory}")
    except FileNotFoundError:
        print(f"Error: Directory {directory} not found.")
        exit(1)

    # Detect all supported files in the specified directory
    files = glob.glob("*.c") + glob.glob("*.cpp") + glob.glob("*.java") + glob.glob("*.cs") + glob.glob("*.py") + glob.glob("*.js") + glob.glob("*.go")
    results = {}

    for file in files:
        print(f"Processing {file}...")
        result = compile_and_run(file)
        results[file] = result

    # Write results to a .txt file in the BasicIDE/src directory
    script_dir = os.path.dirname(os.path.abspath(__file__))  # Get the directory of the script
    results_file_path = os.path.join(script_dir, "results.txt")
    with open(results_file_path, "w") as f:
        for filename, output in results.items():
            f.write(f'"{filename}":"{output}",\n')