import { getEl, createElement } from "utils";

import "./style.scss";

let $dtsPortalContainer = "",
  containerBuilt = false;

export default class DateTimeSelectorPortal {
  static defaultGlobalContainerId = "air-dts-portal-container";
  static buildGlobalContainer(id) {
    containerBuilt = true;

    $dtsPortalContainer = createElement({ className: id, id });
    getEl("body").appendChild($dtsPortalContainer);
  }
  constructor({ dts, opts }) {
    this.dts = dts;
    this.opts = opts;

    this.$portal = createElement({ className: "air-dts air-dts-portal" });

    this.inited = false;
    this.visible = false;
    this.inFocus = false;

    this.init();
  }

  init() {
    let $body = getEl("body");

    let shouldBuildGlobalContainer =
      // Check if global container still exist in DOM
      !containerBuilt ||
      (containerBuilt &&
        $dtsPortalContainer &&
        !$body.contains($dtsPortalContainer));

    if (shouldBuildGlobalContainer) {
      DateTimeSelectorPortal.buildGlobalContainer(
        DateTimeSelectorPortal.defaultGlobalContainerId
      );
    }

    this._bindEvents();
  }

  _bindEvents() {
    this.$portal.addEventListener("mousedown", this._onMouseDown);
    this.$portal.addEventListener("mouseup", this._onMouseUp);
    window.addEventListener("resize", this._onResize);
  }

  _onMouseDown = (e) => {
    this.inFocus = true;
  };

  _onMouseUp = (e) => {
    this.inFocus = false;
    this.dts.nav.$title.focus();
  };

  _onResize = () => {
    if (this.visible) {
      this.setPosition();
    }
  };

  toggleVisibility() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    if (!this.visible) {
      this._createComponents();
    }

    this.setPosition();

    this.$portal.classList.add("-active-");
    this.visible = true;
  }

  hide() {
    this.visible = false;

    this.$portal.classList.remove("-active-");

    this._destroyComponents();
    this.$container.removeChild(this.$portal);
  }

  _setPositionClasses(pos = "bottom left") {
    pos = pos.split(" ");
    let main = pos[0],
      sec = pos[1],
      classes = `-${main}-${sec}- -from-${main}-`;

    this.$portal.classList.add(...classes.split(" "));
  }

  setPosition = () => {
    const position = "bottom left";

    let vpDims = this.dts.$el.getBoundingClientRect(),
      dims = this.dts.$el.getBoundingClientRect(),
      $dpOffset = this.$portal.offsetParent,
      $elOffset = this.dts.$el.offsetParent,
      selfDims = this.$portal.getBoundingClientRect(),
      pos = position.split(" "),
      top,
      left,
      scrollTop = window.scrollY,
      scrollLeft = window.scrollX,
      offset = this.opts.offset,
      main = pos[0],
      secondary = pos[1];

    // If datepicker's container is the same with target element
    if ($dpOffset === $elOffset && $dpOffset !== document.body) {
      dims = {
        top: this.$el.offsetTop,
        left: this.$el.offsetLeft,
        width: vpDims.width,
        height: this.$el.offsetHeight,
      };

      scrollTop = 0;
      scrollLeft = 0;
    }

    // If dp container is different from target offset parent
    // and dp offset parent has position not static (default case)
    if ($dpOffset !== $elOffset && $dpOffset !== document.body) {
      let dpOffsetDims = $dpOffset.getBoundingClientRect();

      dims = {
        top: vpDims.top - dpOffsetDims.top,
        left: vpDims.left - dpOffsetDims.left,
        width: vpDims.width,
        height: vpDims.height,
      };

      scrollTop = 0;
      scrollLeft = 0;
    }

    switch (main) {
      case "top":
        top = dims.top - selfDims.height - offset;
        break;
      case "right":
        left = dims.left + dims.width + offset;
        break;
      case "bottom":
        top = dims.top + dims.height + offset;
        break;
      case "left":
        left = dims.left - selfDims.width - offset;
        break;
    }

    switch (secondary) {
      case "top":
        top = dims.top;
        break;
      case "right":
        left = dims.left + dims.width - selfDims.width;
        break;
      case "bottom":
        top = dims.top + dims.height - selfDims.height;
        break;
      case "left":
        left = dims.left;
        break;
      case "center":
        if (/left|right/.test(main)) {
          top = dims.top + dims.height / 2 - selfDims.height / 2;
        } else {
          left = dims.left + dims.width / 2 - selfDims.width / 2;
        }
    }

    this.$portal.style.cssText = `left: ${left + scrollLeft}px; top: ${
      top + scrollTop
    }px`;
  };

  _destroyComponents() {}

  get $container() {
    return $dtsPortalContainer;
  }

  _createComponents() {
    this._buildBaseHtml();

    this._setPositionClasses();
  }

  _buildBaseHtml() {
    this.$container.appendChild(this.$portal);

    this.$portal.innerHTML =
      "" + '<div class="air-dts--content">Hello World</div>';
    this.$content = getEl(".air-dts--content", this.$portal);
  }

  render() {}
}
