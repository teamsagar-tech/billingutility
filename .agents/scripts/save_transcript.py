import sys
import json
import shutil
import os

def main():
    try:
        # Read from stdin
        input_data = json.load(sys.stdin)
        
        transcript_path = input_data.get("transcriptPath")
        artifact_path = input_data.get("artifactDirectoryPath")
        workspace_paths = input_data.get("workspacePaths", [])
        
        if workspace_paths:
            workspace = workspace_paths[0]
            conv_id = input_data.get("conversationId", "unknown")
            
            # 1. Sync Transcripts
            if transcript_path:
                conv_dir = os.path.join(workspace, ".agents", "conversations")
                os.makedirs(conv_dir, exist_ok=True)
                
                dest_path = os.path.join(conv_dir, f"{conv_id}.jsonl")
                transcript_full = transcript_path.replace("transcript.jsonl", "transcript_full.jsonl")
                dest_full_path = os.path.join(conv_dir, f"{conv_id}_full.jsonl")
                
                if os.path.exists(transcript_path):
                    shutil.copy2(transcript_path, dest_path)
                
                if os.path.exists(transcript_full):
                    shutil.copy2(transcript_full, dest_full_path)
            
            # 2. Sync Artifacts (Plans, Tasks, Walkthroughs)
            if artifact_path and os.path.exists(artifact_path):
                plans_dir = os.path.join(workspace, ".agents", "plans", conv_id)
                os.makedirs(plans_dir, exist_ok=True)
                
                # Copy all markdown and relevant files from artifacts
                for item in os.listdir(artifact_path):
                    src_item = os.path.join(artifact_path, item)
                    dst_item = os.path.join(plans_dir, item)
                    if os.path.isfile(src_item):
                        shutil.copy2(src_item, dst_item)
                    elif os.path.isdir(src_item) and item != ".system_generated":
                        shutil.copytree(src_item, dst_item, dirs_exist_ok=True)
                        
    except Exception as e:
        # Silently fail so we don't break the agent loop
        pass
        
    # Output expected by Stop contract
    print(json.dumps({"decision": "stop"}))

if __name__ == "__main__":
    main()
