/**
 * Question Unit plugin to render a QuML question
 * @class org.ekstep.questionunit.quml
 * @extends org.ekstep.contentrenderer.questionUnitPlugin
 * @author Jagadish P <jagadish.pujari@tarento.com>
 */
org.ekstep.questionunit.quml = {};
org.ekstep.questionunit.quml.RendererPlugin = org.ekstep.contentrenderer.questionUnitPlugin.extend({
    responseValueMap: {},
    _selectedIndex: undefined,
    setQuestionTemplate: function () {
        QuMLFeedbackPopup.initTemplate(this);// eslint-disable-line no-undef
    },
    preQuestionShow: function(event) {
        this._question.overrideFeedbackPopUp = true; // Overriding Feedback popup
        if(isbrowserpreview && (Renderer.theme._basePath === "/assets/")){
            Renderer.theme._basePath = "/";
        }
        var questionData = JSON.parse(event.target._currentQuestion.data.__cdata);
        var questionConfig = JSON.parse(event.target._currentQuestion.config.__cdata);
        questionData.question = this.replaceAssetWithBaseURL(questionData.question);
        if (/<div\s(?:class="mathText")>(.*?)<\/div>/.test(questionData.question)) {
            questionData.question = questionData.question.replace(/<div\s(?:class="mathText")>(.*?)<\/div>/gm, "<span class=\"mathText\">$1</span>")
        }
        if (/(\^\\textdegree)/.test(questionData.question)) {
            questionData.question = questionData.question.replace(/(\^\\textdegree)/gm, "^\\degree")
        }

        /* check for if questiondata solution is not empty and question type is reference */
        if (!_.isEmpty(questionData.solutions) && questionConfig.metadata.type == 'reference') {
            questionData.solutions[0].value = this.replaceAssetWithBaseURL(questionData.solutions[0].value)

            if (/<div\s(?:class="mathText")>(.*?)<\/div>/.test(questionData.solutions[0].value)) {
                questionData.solutions[0].value = questionData.solutions[0].value.replace(/<div\s(?:class="mathText")>(.*?)<\/div>/gm, "<span class=\"mathText\">$1</span>")
            }
            if (/(\^\\textdegree)/.test(questionData.solutions[0].value)) {
                questionData.solutions[0].value = questionData.solutions[0].replace(/(\^\\textdegree)/gm, "^\\degree")
            }
        }
        event.target._currentQuestion.data.__cdata = JSON.stringify(questionData);
        QuMLFeedbackPopup._questionData = questionData;
        this._super(event);
        var buttonLabel = "Solution"
        var starDiv = "<span class='sb-star-icon'>&#9733;</span>";
        if(this._question.config.metadata.category == 'CuriosityQuestion') {
            buttonLabel = "Explanation";
            starDiv = "";
        }
        if (this._question.config.metadata.type == 'reference') {
            questionData.answer = this.replaceAssetWithBaseURL(questionData.answer);
            if (/<div\s(?:class="mathText")>(.*?)<\/div>/.test(questionData.answer)) {
                questionData.answer = questionData.answer.replace(/<div\s(?:class="mathText")>(.*?)<\/div>/gm, "<span class=\"mathText\">$1</span>")
            }
            if (/(\^\\textdegree)/.test(questionData.answer)) {
                questionData.answer = questionData.answer.replace(/(\^\\textdegree)/gm, "^\\degree")
            }

            var questionAnswer = "<div class='sb-question-dsp-body'> \
            <div class='sb-question-header question-bg'> \
                <button  class='sb-btn sb-btn-primary sb-btn-normal' id='questionBtn' style='display: none;' type='button'>Question</button> \
                <button  class='sb-btn sb-btn-secondary sb-btn-normal mr-0' id='answerBtn' type='button' style='display: inline-block;'>Answer</button> \
            </div> \
            <div class='sb-question-content'> \
            <div class='page-section question-bg' id='question'> \
              <div class='sb-question'>Question" + starDiv + "</div>\
              <div class='sb-question-content-card'>" + questionData.question + "</div> \
            </div> \
            <div class='page-section answer-bg' id='answer'> \
              <div class='sb-answer'>Answer</div> \
              <div  class='sb-question-content-card'>" + questionData.answer + "</div> \
            </div>";
            var solution = "";
            if(!_.isEmpty(questionData.solutions)) {
             if(questionData.solutions[0].type == 'video'){
                var thumbnail = '';
                var videoName = '';
                var index = _.findIndex(questionData.media, function(o) { return o.type == 'video' && o.id === questionData.solutions[0].value; });
                if(index >= 0){
                  thumbnail = questionData.media[index].thumbnail;
                  thumbnail = (thumbnail) && this.replaceAssetWithBaseURL(thumbnail);
                  videoName = questionData.media[index].name;
                }
                QuMLFeedbackPopup.createSolutionPopUpElement();
                var thumbnailDiv = thumbnail ? '<div class="sb-solution-card"><img src="'+thumbnail+'" alt="image"></div>' :  '<div class="sb-solution-card"></div>';

                var videoDiv = '<div class="sbcard-solution-content">\
                    <div class="solution-container" onclick="QuMLFeedbackPopup.showSolution()">' + thumbnailDiv + '\
                      <div class="sb-solution-card-overlay">\
                        <div class="play-btn">\
                        <img src="' + QuMLFeedbackPopup.pluginInstance.getDefaultAsset('player-play-button.png') + '">\
                        </div>\
                      </div>\
                    </div>\
                    <div class="solution-content">\
                      <button class="sb-btn sb-btn-normal sb-btn-outline-primary sb-btn-responsive" type="button" onclick="QuMLFeedbackPopup.showSolution()">Play\
                          Video</button>\
                          <p>'+ videoName +'</p>\
                    </div>\
                </div>';
                solution = "<div class='page-section answer-bg' id='solution'> \
                <div class='sb-answer'>" + buttonLabel + "</div> \
                <div  class='sb-question-content-card'>" + videoDiv + "</div> \
                </div>";
             }else if(questionData.solutions[0].type == 'html'){
                solution = "<div class='page-section answer-bg' id='solution'> \
                <div class='sb-answer'>" + buttonLabel + "</div> \
                <div  class='sb-question-content-card'>" + questionData.solutions[0].value + "</div> \
                </div>";
             }
            }
            this._question.template = questionAnswer + solution + "</div></div>";

        } else {
            this._question.template = questionData.question
        }
    },
    /**
     * Listen event after display the question
     * @memberof org.ekstep.questionunit.quml
     * @param {Object} event from question set.
     */
    postQuestionShow: function() {
        var instance = this;
        QSTelemetryLogger.logEvent(QSTelemetryLogger.EVENT_TYPES.ASSESS); // eslint-disable-line no-undef
        if (this._question.state && _.has(this._question.state, 'val')) {
            this._selectedIndex = this._question.state.val;
        } else {
            this._selectedIndex = undefined;
        }
        $('.chevron').on('click', function(e) {
            $('.mcq-title').toggleClass('expand');
            $('.chevron').toggleClass('icon-active');
            e.preventDefault();
        });
        //Retain previous state to question
        var preSelected = $('.mcq-options').children()[this._selectedIndex];
        $(preSelected).addClass('mcq-options-select');

        instance.responseValueMap = {};
        $('.mcq-options .mcq-option').on('click', function(e) {
            $(".mcq-options .mcq-option").removeClass("mcq-options-select");
            if (this.attributes.hasOwnProperty('data-simple-choice-interaction') === true) {
                $(this).addClass('mcq-options-select');
                var resVal = this.attributes['data-response-variable'].value;
                instance.responseValueMap[resVal] = this.attributes.value.value;
                instance._selectedIndex = this.attributes.value.value;
                var telValues = {};
                telValues['option' + this.attributes.value.value] = $(this).text();
                QSTelemetryLogger.logEvent(QSTelemetryLogger.EVENT_TYPES.RESPONSE, { // eslint-disable-line no-undef
                    "type": "MCQ",
                    "values": [telValues]
                });
            }
        });
        if(this._question.config.metadata.type == 'reference'){
            if (!_.isEmpty(this._question.data.solutions)) {

                document.getElementById('questionset').className = 'sb-question-dsp-container'
                document.getElementById('answerBtn').onclick = function() {
                    $('.sb-question-content').animate({
                        scrollTop: $('#answer').offset().top - 200
                    });

                    instance.logTelemetryInteract({target : { id : 'answerBtn' }});
                    QSTelemetryLogger.logEvent(QSTelemetryLogger.EVENT_TYPES.RESPONSE, { // eslint-disable-line no-undef
                        "type": "SELECT",
                        "values": [{
                            "option": "answer"
                        }]
                    });
                }
                document.getElementById('questionBtn').onclick = function() {
                    $('.sb-question-content').animate({
                        scrollTop: $('#question').offset().top
                    });
                    instance.logTelemetryInteract({target : { id : 'questionBtn' }});
                    QSTelemetryLogger.logEvent(QSTelemetryLogger.EVENT_TYPES.RESPONSE, { // eslint-disable-line no-undef
                        "type": "SELECT",
                        "values": [{
                            "option": "question"
                        }]
                    });
                }
                $('.sb-question-content').scroll(function() {
                if ($('#answer').position().top <= ($('.sb-question-content').height()) / 2) {
                    $('#answerBtn').css('display', 'none')
                    $('#questionBtn').css('display', 'inline-block')
                } else {
                    $('#answerBtn').css('display', 'inline-block')
                    $('#questionBtn').css('display', 'none')
                }
                })
             }
        else {
            document.getElementById('questionset').className = 'sb-question-dsp-container'
            document.getElementById('answerBtn').onclick = function() {
                $('.sb-question-content').animate({
                    scrollTop: $('#answer').offset().top - 200
                });
                instance.logTelemetryInteract({target : { id : 'answerBtn' }});
                QSTelemetryLogger.logEvent(QSTelemetryLogger.EVENT_TYPES.RESPONSE, { // eslint-disable-line no-undef
                    "type": "SELECT",
                    "values": [{
                        "option": "answer"
                      }]
                });
            }
            document.getElementById('questionBtn').onclick = function() {
                $('.sb-question-content').animate({
                    scrollTop: $('#question').offset().top
                });
                instance.logTelemetryInteract({target : { id : 'questionBtn' }});
                QSTelemetryLogger.logEvent(QSTelemetryLogger.EVENT_TYPES.RESPONSE, { // eslint-disable-line no-undef
                    "type": "SELECT",
                    "values": [{
                        "option": "question"
                      }]
                });
            }
            $('.sb-question-content').scroll(function() {
                if ($('#answer').position().top <= ($('.sb-question-content').height()) / 2) {
                    $('#answerBtn').css('display', 'none')
                    $('#questionBtn').css('display', 'inline-block')
                } else {
                    $('#answerBtn').css('display', 'inline-block')
                    $('#questionBtn').css('display', 'none')
                }
                })
            }
        }
        jQuery('.mathText').each(function(index, element) {
            katex.render(element.innerText, jQuery(element)[0]);
        });
    },
    /**
     * Question evalution
     * @memberof org.ekstep.questionunit.quml
     * @param {Object} event from question set.
     */
    evaluateQuestion: function(event) {
        var instance = this;
        QuMLFeedbackPopup._callback = event.target;
        QuMLFeedbackPopup._questionData = instance._question.data;
        var telValues = {},
            result = {},
            correctAnswer = false;
        if (this._question.config.metadata.type == 'mcq') {
            var responseDeclaration = this._question.data.responseDeclaration;
            if(_.isEmpty(instance.responseValueMap)){
                if(instance._selectedIndex){
                    instance.responseValueMap['responseValue'] = instance._selectedIndex;
                }
            }
            var key = _.keys(instance.responseValueMap);
            if (key.length > 0 && responseDeclaration[key[0]].correct_response.value === instance.responseValueMap[key[0]]) {
                correctAnswer = true;
            }

            var params = [];
            if(this._question.data.options){
                _.forEach(this._question.data.options, function(val){
                    var temp = {};
                    var index = parseInt(val.value.resindex) + 1;
                    if(val.answer){
                        params.push({'answer': JSON.stringify({ "correct": [index.toString()] })});
                    }
                    temp[index] = JSON.stringify({ text: val.value.body });
                    if(val.value.resindex === parseInt(instance._selectedIndex)){
                        telValues[index] = JSON.stringify({ text: val.value.body });
                    }
                    params.push(temp);
                })

            }
            result = {
                eval: correctAnswer,
                state: {
                    val: _.isUndefined(instance.responseValueMap[key[0]]) ? instance._selectedIndex : instance.responseValueMap[key[0]]
                },
                score: correctAnswer ? instance._question.config.max_score : 0,
                values: [telValues],
                params: params,
                type: instance._question.config.metadata.type,
            }
            // Generate ASSESS EVENT
            QSTelemetryLogger.logEvent(QSTelemetryLogger.EVENT_TYPES.ASSESSEND, result);
            //Show feedback
            this.showQumlFeedback(result);

        } else {
            result = {
                eval: correctAnswer,
                evalRequired: false
            }
            if (_.isFunction(QuMLFeedbackPopup._callback)) {
                QuMLFeedbackPopup._callback(result);
            }
        }
    },
    /**
   * provide media url to audio image
   * @memberof org.sunbird.questionunit.quml
   * @returns {String} url.
   * @param {String} icon from question set.
   */
  getDefaultAsset: function (icon) {
    //In browser and device base path is different so we have to check
    if (isbrowserpreview) {// eslint-disable-line no-undef
      return this.getAssetUrl(org.ekstep.pluginframework.pluginManager.resolvePluginResource(this._manifest.id, this._manifest.ver, "renderer/assets/" + icon));
    }
    else {
      //static url
      return this.getAssetUrl("content-plugins/" + this._manifest.id + "-" + this._manifest.ver + "/renderer/assets/" + icon);
    }
  },
  /**
  * provide media url to asset
  * @memberof org.sunbird.questionunit.quml
  * @param {String} url from question set.
  * @returns {String} url.
  */
  getAssetUrl: function (url) {
    if (isbrowserpreview) {// eslint-disable-line no-undef
      return url;
    }
    else {
      return  EkstepRendererAPI.getBaseURL() + url;
    }
  },
    /**
     * provide evaluated result
     * @memberof org.ekstep.questionunit.quml
     */
    showQumlFeedback: function(result){
        QuMLFeedbackPopup.result = result;
        if (result.eval) {
            QuMLFeedbackPopup.showGoodJob();
        }else{
            QuMLFeedbackPopup.showTryAgain();
        }
    },
    /**
     * provide media url to asset
     * @memberof org.ekstep.questionunit.quml
     * @param {String} url from question set.
     * @returns {String} url.
     */
    replaceAssetWithBaseURL: function(questionData) {
        if(!questionData.includes(EkstepRendererAPI.getBaseURL())){
            return (questionData) && questionData.split('/assets/public/').join(EkstepRendererAPI.getBaseURL() + 'assets/public/');
        }
        else {
            return questionData;
        }
    },
    logTelemetryInteract: function(event) {
        if (event != undefined) QSTelemetryLogger.logEvent(QSTelemetryLogger.EVENT_TYPES.TOUCH, { // eslint-disable-line no-undef
            type: QSTelemetryLogger.EVENT_TYPES.TOUCH, // eslint-disable-line no-undef
            id: event.target.id
        });
    }
});
//# sourceURL=questionunitQUMLPlugin.js
