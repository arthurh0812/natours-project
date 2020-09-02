/* eslint-disable */

const locations = JSON.parse(document.getElementById('map').dataset.locations);

const startLocation = JSON.parse(
  document.getElementById('map').dataset.startlocation
);

locations.unshift(startLocation);

mapboxgl.accessToken =
  'pk.eyJ1IjoiYXJ0aHVyMDgxMiIsImEiOiJja2Vremw4MW8xOWs3MnlucDBsMjU3dnF0In0.2mFIrbCnvElmVgjHWEM6tg';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/arthur0812/ckel8lvxb12yd19nsfelafzbe',
  scrollZoom: false,
  // center: startLocation.coordinates,
  // zoom: 4.4,
  // interactive: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc, index) => {
  // create marker with class 'marker'
  const el = document.createElement('div');

  if (index === 0) el.classList.add('start-marker');
  else el.classList.add('marker');

  // integrate marker into mapbox map 'map'
  const marker = new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    // add a popup to the marker
    .setPopup(
      new mapboxgl.Popup({
        offset: 30,
        closeOnClick: false,
      })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    )
    .addTo(map);

  // start marker should be popped up
  if (index === 0) marker.togglePopup();

  // extend map bounds to include current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 175,
    bottom: 175,
    right: 100,
    left: 100,
  },
});
