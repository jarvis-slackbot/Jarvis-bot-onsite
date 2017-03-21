/*
    Helper file to help handle user arguments
    Argument functions that are/will be shared across files

    Note on arguments:
        All arguments that are boolean should be used first.
        INCORRECT: -tk 'tagname' will give precedence to the k value, ignoring the 'tagname' value
        CORRECT: -kt 'tagname'
        (Assuming t = tagname arg and k = boolean arg)

        Arguments should be split when multiple input is needed
        CORRECT: /jarvis ec2cpu -t JarvisTestServer -m 20
 */


exports.hasArgs = (args) => {
    return !!args;
};



// Filter instances by tag value
// Handler for tag arguments
exports.filterInstListByTagValues = (instList,args) => {
    var newInstList = [];
    var tagData = getArgTagData(args);
    // If there is user tag data
    if(tagData && tagData.Arg !== 'null') {

        // notags was selected
        if(tagData.Arg === 'notags')
            newInstList = getInstListWithNoTags(instList);
        // notag was selected
        else if(tagData.Arg === 'notag')
            newInstList = getInstListByNoTag(instList,tagData.Tag, tagData.Key);
        // tag -- DEFAULT OPTION FOR MOST TAG COMMANDS, KEEP AT END OF CHECKS
        else if(tagData.Arg === 'tag')
            newInstList = getInstListbyTag(instList,tagData.Tag, tagData.Key);
        else
            newInstList = instList;

    }
    else{
        newInstList = instList;
    }

    return newInstList;
};

// Filter EBS volumes by encryption state
exports.filterEBSByEncryption = (volumes, args) => {
    var res = volumes;
    var encryptedArg = args.hasOwnProperty('encrypted');
    var notEncryptedArg = args.hasOwnProperty('not-encrypted');
    // Args has an encrypted state provided from user (exclusive)
    if(args &&
        ((encryptedArg || notEncryptedArg) && !(encryptedArg && notEncryptedArg))) {
        res = [];
        volumes.forEach((volume) => {
            var encrypted = volume.Encrypted;
            if(encrypted && encryptedArg) {
                res.push(volume);
            }
            else if (!encrypted && notEncryptedArg){
                res.push(volume);
            }
        });
    }

    return res;
};


// Get user defined tag from argument
function getArgTagData(args){
    var tag = [];
    var argument = 'null';
    var res = null;

    if(args) {
        if (args.hasOwnProperty('notags')) {
            tag = '';
            argument = 'notags';
        }
        else if(args.hasOwnProperty('notag')){
            tag = args.notag;
            tag = tag.join(' '); // For tags with spaces
            argument = 'notag';
        }
        // MUST be last check
        else if (args.hasOwnProperty('tag')) {
            tag = args.tag;
            tag = tag.join(' '); // For tags with spaces
            argument = 'tag';
        }

        res = {
            Tag: tag,
            Arg: argument,
            Key: args.hasOwnProperty('key')
        }
    }

    return res;
}


// Get inst list of all instances that have NO tags
function getInstListWithNoTags(instList){
    var newInstList = [];
    instList.forEach((inst) => {
        if(listEmpty(inst.Tags)){
            newInstList.push(inst);
        }
    });
    return newInstList;
}




// Get inst list that doesn't contain the tag
function getInstListByNoTag(instList, tagName, keyFlag){
    var newInstList = [];
    instList.forEach((inst) => {
        var tags = inst.Tags;
        var hasTag = false;
        tags.forEach((tag) => {
            tag = keyFlag ? tag.Key : tag.Value;
            if (tag === tagName && !inList(inst, newInstList)) {
                hasTag = true;
            }

        });
        if(!hasTag)
            newInstList.push(inst);
    });
    return newInstList;
}

// Get inst list that does contain the tag
function getInstListbyTag(instList, tagName, keyFlag){
    var newInstList = [];
    instList.forEach((inst) => {
        var tags = inst.Tags;
        tags.forEach((tag) => {
            tag = keyFlag ? tag.Key : tag.Value;
            if (tag === tagName && !inList(inst, newInstList)) {
                newInstList.push(inst);
            }

        });
    });
    return newInstList;
}

function inList(value, list){
    return list.indexOf(value) > -1;
}

// Return true for empty list
function listEmpty(list){
    return !(typeof list !== 'undefined' && list.length > 0);
}
