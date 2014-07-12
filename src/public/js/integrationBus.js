/*
Copyright 2014 
Author John Hosie 
 
  All rights reserved. This program and the accompanying materials
  are made available under the terms of the Eclipse Public License v1.0
  which accompanies this distribution, and is available at
  http://www.eclipse.org/legal/epl-v10.html
 
  Contributors:
      John Hosie - initial implementation 
*/

function getIntegrationBus(callback){
    $.getJSON('/apiv1/integrationbus?depth=7',function(root){
        callback(null,root);                    
    }).fail(function(error){
        callback(callback,null);
    });
}

