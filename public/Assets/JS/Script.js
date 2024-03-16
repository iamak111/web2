// Carousel Slide Script
$(document).ready(function () {
  $("#carouselExampleIndicators").carousel({
    interval: 4000,
  });

  var clickEvent = false;
  $("#carouselExampleIndicators")
    .on("click", ".nav a", function () {
      clickEvent = true;
      $(".nav li").removeClass("active");
      $(this).parent().addClass("active");
    })
    .on("slid.bs.carousel", function (e) {
      if (!clickEvent) {
        var count = $(".nav").children().length - 1;
        var current = $(".nav li.active");
        current.removeClass("active").next().addClass("active");
        var id = parseInt(current.data("bs-slide-to"));
        if (count == id) {
          $(".nav li").first().addClass("active");
        }
      }
      clickEvent = false;
    });
});

var swiper = new Swiper(".swiper1", {
  slidesPerView: 4,
  spaceBetween: 25,
  loop: true,
  centerSlide: "true",
  fade: "true",
  grabCursor: "true",
  pagination: {
    el: ".swiper-pagination-1",
    clickable: true,
    dynamicBullets: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints: {
    0: {
      slidesPerView: 1.2,
    },
    520: {
      slidesPerView: 2.4,
    },
    950: {
      slidesPerView: 4,
    },
  },
});

var swiper = new Swiper(".swiper2", {
  slidesPerView: 4,
  spaceBetween: 25,
  loop: true,
  centerSlide: "true",
  fade: "true",
  grabCursor: "true",
  pagination: {
    el: ".swiper-pagination-2",
    clickable: true,
    dynamicBullets: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints: {
    0: {
      slidesPerView: 1.2,
    },
    520: {
      slidesPerView: 2.4,
    },
    950: {
      slidesPerView: 4,
    },
  },
});

var swiper = new Swiper(".swiper3", {
  slidesPerView: 4,
  spaceBetween: 25,
  loop: true,
  centerSlide: "true",
  fade: "true",
  grabCursor: "true",
  pagination: {
    el: ".swiper-pagination-3",
    clickable: true,
    dynamicBullets: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints: {
    0: {
      slidesPerView: 1.2,
    },
    520: {
      slidesPerView: 2.4,
    },
    950: {
      slidesPerView: 4,
    },
  },
});
