<?php if (!defined('ABSPATH')) {
    exit;
}

$copyrightYear = date('Y');
$copyrightName = esc_html(SITE_NAME);
?>
<footer class="footer">
    <p class="footer_copyright">
        &copy;
        <?php echo $copyrightYear; ?>
        <?php echo $copyrightName; ?>
    </p>
</footer>
<!-- /.footer -->

<?php wp_footer(); ?>
</body>

</html>
