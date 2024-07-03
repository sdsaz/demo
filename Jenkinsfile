pipeline {

    agent {
        node {
            label 'master'
        }
    }
	
//This is for teams Notification Channel message
    options {
         office365ConnectorWebhooks([
            [name: "Office 365", url: "https://shivohm.webhook.office.com/webhookb2/bc232e36-e747-4b76-9dfc-5d502d83e32e@75194700-0fa5-482c-9b62-946526601227/IncomingWebhook/c11ccfb23e9d4e0ea9ec14cc9a50d93d/f8745ad8-3edb-46bd-bd55-54f734938321", notifyBackToNormal: 'true', notifyFailure: 'true', notifyRepeatedFailure: 'true', notifySuccess: 'true', notifyAborted: 'true']
        ])
    }
	
//Server Credentials
   environment {
                qa = credentials('dicrm_qa')
                beta = credentials('dicrm_beta')
                prod = credentials('dicrm_prod')
                bosprod = credentials('bos_prod')
              }
			  
//Deployment Stages
   stages {
             
        stage('DICRM, ERC, MFW  QA Env Deploy') {
            
            when {
                branch 'qa'
            }
            
            steps {            
                bat """

                echo off
                
                set SERVER1=34.216.118.22:8172
                set USERNAME1="$qa_USR"
                set PASSWORD1="$qa_PSW"
				set DISPLAYNAME=DICRM_WEB
                set APP1=QA DICRM Web and Gateway
                set APP2=QA ERC Web and Gateway
				set APP3=QA MFW Web and Gateway
                set SKIPBACKUP="\\assets\\files|\\.well-known|web.config"
                set SKIPREMOTEDIRDELETE="assets"
                set SKIPFILES="web.config|config.json"
                set NPMINSTALL=0
				
                buildv2.cmd

                """
            }
        }

	stage('DICRM & ERC BETA Env Deploy') {
            
            when {
                branch 'beta'
            }
            
            steps {    
                bat """

                echo off
                
                set SERVER1=43.204.155.91:8172
                set USERNAME1="$beta_USR"
                set PASSWORD1="$beta_PSW"
		        set DISPLAYNAME=DICRM_WEB
                set APP1=BETA DICRM Web and Gateway
                set APP2=BETA ERC Web and Gateway
				set APP3=BETA MFW Web and Gateway
                set SKIPBACKUP="\\assets\\files|\\.well-known|web.config"
                set SKIPREMOTEDIRDELETE="assets"
                set SKIPFILES="web.config|config.json"
                set NPMINSTALL=0
				
                buildv2.cmd

                """
            }
        }

	stage('Approval') {
            //no agent, so executors are not used up when waiting for approvals
            agent none
            when {
                branch 'main'
            }
            steps {
                script {
                    def deploymentDelay = input id: 'Deploy', message: 'Deploy to production?', submitter: 'rkivisto,admin,dicrm', parameters: [choice(choices: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'], description: 'Hours to delay deployment?', name: 'deploymentDelay')]
                    sleep time: deploymentDelay.toInteger(), unit: 'HOURS'
                }
            }
        }


	stage('DICRM & ERC PROD Env Deploy') {
            
            when {
                branch 'main'
            }
            
            steps {           
                bat """

                echo off
                
                set SERVER1=100.21.211.59:8172
                set USERNAME1="$prod_USR"
                set PASSWORD1="$prod_PSW"

                set SERVER2=4.242.35.225:8172
                set USERNAME2="$bosprod_USR"
                set PASSWORD2="$bosprod_PSW"

		        set DISPLAYNAME=DICRM_WEB
                set APP1=PROD DICRM Web and Gateway
                set APP2=PROD ERC Web and Gateway
                set APP3=PROD MFW Web and Gateway
                set APP4=PROD BOS Web and Gateway

                set SKIPBACKUP="\\assets\\files|\\.well-known|web.config"
                set SKIPREMOTEDIRDELETE="assets"
                set SKIPFILES="web.config|config.json"
                set NPMINSTALL=0
                
                buildv3.cmd

                """
            } 
        }   
    }   
}
