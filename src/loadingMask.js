import './loadinganimation.css';

export default function setLoading(el, loading) {
    if (!el.hasClass('x-mask-host')) {
        el.addClass('x-mask-host');
        el.append('<div class="x-mask" style="display:none"><div class="x-mask-msg"><div class="x-mask-msg-inner"> </div></div></div>');
    }
    el.find('> .x-mask').toggle(loading);
}