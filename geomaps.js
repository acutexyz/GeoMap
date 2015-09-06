Objects = new Mongo.Collection('objects');

GeoObject = new Astro.Class({ // unfortunately 'Object' is a reserved word in JS :/
  name: 'GeoObject',
  collection: Objects,
  fields: {
    'type':         { type: 'string' },
    'name':         { type: 'string' },
    'description':  { type: 'string' },
    'location':     { type: 'object' },
    'location.lat': { type: 'number' },
    'location.lng': { type: 'number' },
    'dangerLevel':  { type: 'number' }
  },
  validators: {
    'type':         [ Validators.required() ],
    'name':         [ Validators.required() ],
    'description':  [ Validators.required() ],
    'location.lat': [ Validators.required(), Validators.number() ],
    'location.lng': [ Validators.required(), Validators.number() ],
    'dangerLevel': [
      Validators.required(), 
      Validators.number(), 
      Validators.gte(0), 
      Validators.lte(10)
    ]
  }
});

if (Meteor.isClient) {
  
  //
  // Routes
  //

  FlowRouter.route('/', {
    triggersEnter: [function(context, redirect) {
      redirect('/objects');
    }]
  });

  FlowRouter.route('/objects', {
    action: function(_params) {
      BlazeLayout.render("mainLayout", {
        content: "objects", 
        top: "topnav"
      });
    },
    name: 'objects'
  });

  FlowRouter.route('/geoportal', {
    triggersEnter: [function(context, redirect) {
      // load google map only on this route
      GoogleMaps.load();
    }],
    action: function(_params) {
      BlazeLayout.render("mainLayout", {
        content: "geoportal", 
        top: "topnav"
      });
    },
    name: 'geoportal'
  });

  FlowRouter.route('/logout', {
    action: function(_params) {
      AccountsTemplates.logout();
    }
  });


  //
  // Authentication setup
  //

  AccountsTemplates.configure({
    defaultLayout: 'mainLayout',
    defaultLayoutRegions: {},
    defaultContentRegion: 'content', 
    confirmPassword: false
  });

  // set up auth routes with full-page forms
  AccountsTemplates.configureRoute('signIn');
  AccountsTemplates.configureRoute('signUp');

  // protect all routes from unauthorized access
  FlowRouter.triggers.enter([AccountsTemplates.ensureSignedIn]);


  //
  // Template helpers and events
  //

  // these helpers are used to set active nav item
  Template.topnav.helpers({
    isObjectsActive: function() {
      return FlowRouter.getRouteName() == 'objects' ? 'active' : '';
    },
    isGeoportalActive: function() {
      return FlowRouter.getRouteName() == 'geoportal' ? 'active' : '';
    }
  });

  Template.objectModalForm.helpers({
    // used in the form to fill default values and validation errors
    object: function() {
      if (!Session.get('object')) {
        Session.set('object', new GeoObject());
      }
      return Session.get('object');
    }
  });

  Template.objectModalForm.events({
    'submit #objectForm': function(event, template) {
      event.preventDefault();
      var form = event.target;
      var object = Session.get('object');
      object.set({
        'type': form.type.value,
        'name': form.name.value,
        'description': form.description.value,
        'location': {},
        'location.lat': form.lat.value,
        'location.lng': form.lng.value,
        'dangerLevel': form.dangerLevel.value
      });
      Session.set('object', object);
      if (object.validateAll()) {
        // save and close form
        object.save();
        var modal = $(template.find('.modal'));
        modal.modal('hide');
      } else {
        // re-render the template to provide it with validation errors
        Session.set('object', object);
      }
    },
    // clear template context when form is closed to clear the form
    'hidden.bs.modal #myModal': function(event, template) {
      Session.set('object', null);
    },
    // set <select> values when form is shown (it's cleaner to do it here than on the template)
    'shown.bs.modal #myModal': function(event, template) {
      var typeSelect = template.find('select[name=type]');
      typeSelect.value = this.type || 'institution';
      var dangerLevelSelect = template.find('select[name=dangerLevel]');
      dangerLevelSelect.value = this.dangerLevel || 0;
    }
  });
  
  Template.objectsTable.helpers({
    settings: function() {
      return {
        collection: Objects,
        rowsPerPage: 10,
        showFilter: true,
        fields: [
          {
            key: 'type', 
            label: 'Тип', 
            fn: function(value, object) {
              var dict = {
                institution: 'Учреждение',
                nature: 'Природа',
                infrastructure: 'Инфраструктура',
                transport: 'Транспорт',
                human: 'Человек',
                territory: 'Территория',
                'undefined': 'Неопределённый'
              }
              return dict[value];
            }
          },
          {key: 'name', label: 'Название'},
          {key: 'dangerLevel', label: 'Уровень опасности'},
          {key: 'description', label: 'Описание'},
          {key: 'edit', label: 'Редактировать', tmpl: Template.objectEditButton}
        ]
      }
    }
  });

  Template.objectEditButton.events({
    'click button': function(event, template) {
      var object = Objects.findOne({_id: this._id});
      Session.set('object', object);
      $('#myModal').modal('show');
    }
  });

  //
  // Maps
  //

  Template.geoportal.helpers({
    mapOptions: function() {
      if (GoogleMaps.loaded()) {
        return {
          center: new google.maps.LatLng(42.8760664, 74.5912887), // Bishkek city
          zoom: 12,
          disableDoubleClickZoom: true
        }
      }
    }
  });

  Template.geoportal.events({
    // resets the Session.checkedFilters which in turn triggers the
    // template to re-render and display Markers of only checked types
    'change input[type=checkbox]': function(e) {
      var checkedObjectTypes = [];
      var checkboxes = $('input[type=checkbox]');
      for (var i = checkboxes.length - 1; i >= 0; i--) {
        if (checkboxes[i].checked) {
          checkedObjectTypes.push(checkboxes[i].value);
        }
      };
      Session.set('checkedFilters', checkedObjectTypes);
    }
  });

  Template.geoportal.onCreated(function() {
    var template = this;

    GoogleMaps.ready('geoMap', function(map) {
      var markers = {};

      // each object type will have its own icon
      var markerIcons = {
        institution: '/images/school1.png',
        nature: '/images/pines2.png',
        infrastructure: '/images/electric.png',
        transport: '/images/bus46.png',
        human: '/images/man19.png',
        territory: '/images/pointer17.png',
        'undefined': '/images/question1.png'
      }
      
      // only one infoWindow instance will be used each time, 
      // as it's recommended in the docs
      var infoWindow = new google.maps.InfoWindow({});

      // put markers on the map
      initializeMarkers();

      //
      // This autorun callback will run every time the 'Objects' Collection changes.
      // When change occurs it will compare existing Markers and DB Objects and perform 
      // minimal changes.  
      // It also gets filters state from Session and hides/shows Markers based on that.
      //
      template.autorun(function(c) {
        var checkedFilters = Session.get('checkedFilters');
        
        var objects = Objects.find().fetch();
        for (var i = objects.length - 1; i >= 0; i--) {
          var object = objects[i];
          var marker = markers[object._id];
          if (marker) {
            // compare
            if (marker.title !== object.name) {
              marker.setTitle(object.name);
            }
            if (marker.position.lat() !== object.location.lat || marker.position.lng() !== object.location.lng) {
              marker.setPosition(object.location);
            }
          } else {
            // add
            marker = addMarkerToMap(object);
            markers[object._id] = marker;
          }
          // if checkedFilters is not null
          if (checkedFilters) {
            // hide or show Marker
            var checked = checkedFilters.indexOf(object.type) > -1;
            marker.setMap(checked ? map.instance : null);
          }
        };
      });

      // on double click on map opens object modal form and 
      // passes clicked coordinates to the form
      map.instance.addListener('dblclick', function(e) {
        var newObject = new GeoObject();
        newObject.set('location', {});
        newObject.set('location.lat', e.latLng.lat());
        newObject.set('location.lng', e.latLng.lng());
        Session.set('object', newObject);
        $('#myModal').modal('show');
      });

      // adds Marker to the Map and adds event listeners
      function addMarkerToMap(object) {
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(object.location.lat, object.location.lng),
          map: map.instance,
          title: object.name,
          draggable: true, 
          icon: markerIcons[object.type],
          id: object._id
        });

        // on marker click show InfoWindow
        addClickListenerOnMarker(marker);
        // update db on dragend
        addDragendListenerOnMarker(marker);
        // edit marker on double click
        addDblclickListenerOnMarker(marker);
        return marker;
      }

      // adds click listener to a Marker that shows a InfoWindow
      function addClickListenerOnMarker(marker) {
        marker.addListener('click', function() {
          var obj = Objects.findOne({_id: marker.id});
          
          // feed the template with object data and render it into html string
          var html = Blaze.toHTML(Blaze.With(obj, function() { 
            return Template.infoWindowContent; 
          }));
          infoWindow.setContent(html);
          infoWindow.open(map.instance, this);
        });
      }

      // updates Mongo on end of dragging Marker
      function addDragendListenerOnMarker(marker) {
        marker.addListener('dragend', function(e) {
          Objects.update({_id: marker.id}, { $set: { 
            'location.lat': e.latLng.lat(), 
            'location.lng': e.latLng.lng() 
          }});
        });
      }

      // double click on a Marker opens object modal form for edit
      function addDblclickListenerOnMarker(marker) {
        marker.addListener('dblclick', function(e) {
          var object = Objects.findOne({_id: marker.id});
          Session.set('object', object);
          // first click opens InfoWindow so close it
          infoWindow.close(); 
          $('#myModal').modal('show');
        });
      }

      // fetches all objects from db and renders them on the map
      function initializeMarkers() {
        var objects = Objects.find().fetch();
        for (var i = objects.length - 1; i >= 0; i--) {
          var marker = addMarkerToMap(objects[i]);
          // save marker
          markers[objects[i]._id] = marker;
        };
      }
    });
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
