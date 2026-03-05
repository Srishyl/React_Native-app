import os
import glob
import re

directories = ['src/**/*.tsx']

files = []
for dir_pattern in directories:
    files.extend(glob.glob(dir_pattern, recursive=True))

for file in files:
    # skip AppText itself and LanguageContext
    if "AppText.tsx" in file or "LanguageContext.tsx" in file:
        continue
    
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original_content = content

    # Check if 'Text' or 'TextInput' or both are imported from react-native
    has_text = "Text" in content
    has_text_input = "TextInput" in content
    
    if not has_text and not has_text_input:
        continue

    # Regex to find react-native imports
    rn_import_pattern = r'import\s+\{([^}]*)\}\s+from\s+[\'"]react-native[\'"];?'
    
    def repl(match):
        imports_str = match.group(1)
        # Parse individual identifiers (e.g., View, Text as RNText, etc.)
        imports = [i.strip() for i in imports_str.split(',') if i.strip()]
        
        # Remove Text and TextInput
        new_imports = [i for i in imports if not re.match(r'^Text$', i) and not re.match(r'^TextInput$', i)]
        
        if not new_imports:
            return ""
        return f"import {{ {', '.join(new_imports)} }} from 'react-native';"
        
    content = re.sub(rn_import_pattern, repl, content)
    
    # Check if we modified the file (i.e. we removed Text or TextInput)
    if content != original_content:
        # Check what was removed exactly from the original match
        match = re.search(rn_import_pattern, original_content)
        if match:
            imports_str = match.group(1)
            imports = [i.strip() for i in imports_str.split(',') if i.strip()]
            removed = [i for i in imports if re.match(r'^Text$', i) or re.match(r'^TextInput$', i)]
            
            if removed:
                # Add import for removed items from AppText
                app_text_imports = ", ".join(removed)
                
                # Determine relative path to src/components/AppText.tsx
                # For simplicity, we just use absolute alias if Expo supports it, wait the project uses relative 
                # imports heavily but earlier I saw `@/components/animated-icon` in _layout.tsx!
                # So `@/components/AppText` works.
                new_import_line = f"\nimport {{ {app_text_imports} }} from '@/components/AppText';\n"
                
                # Insert at the top
                insert_pos = 0
                for line in content.split('\n'):
                    if line.startswith('import '):
                        insert_pos = content.find(line) + len(line)
                        break
                
                content = content[:insert_pos] + new_import_line + content[insert_pos:]
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {file}")

print("Done patching.")
