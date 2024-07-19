# Gmail Email Identifer

A Google App Script Add-On for Gmail that helps user identify dangerous emails.

## Installation and Configuration

### AppScript Setup

1. Go to [Google Appscript](https://www.google.com/script/start/) and login with your Workspace account that has Administrative permissions.
2. Create a New Project
3. Copy the contents of [Code.gs](Code.gs) into the new project.
4. Click the save.![alt text](assets/code_gs_paste.png)
5. Add a new script file to the folder. Name the file config.gs, and copy the contents of [config.example.gs](config.example.gs) into this file.![alt text](assets/config_gs_paste.png)
6. Go to the Gear on the left panel, and check the box for *Show "appscript.json" manafest file in editor*
7. Then copy the [appscript.json](appsscript.example.json) into the appscript.json file in your editor. ![alt text](assets/appscript_json_paste.png)



### Cloud Console Setup
Now that we have the script in place, we have to set up the connection so it will work with your workspace. 

1. Login to Your [Google Cloud Console](https://console.cloud.google.com/)
2. Create a New Project ![alt text](assets/google_cloud_console_new_project.png)


